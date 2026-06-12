import os
import sqlite3
import time
import logging
import jwt
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import hashlib
from app.utils.sms import send_sms_otp, generate_otp

logger = logging.getLogger("aarogyasetu.auth")
router = APIRouter()

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET", "aarogyasetu_secret_key_12345!@#")
JWT_ALGORITHM = "HS256"

# Database Configuration
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "users.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize SQLite database schema
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            phone TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            asha_id TEXT,
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            preferred_language TEXT DEFAULT 'hi',
            role TEXT DEFAULT 'asha_worker',
            verified INTEGER DEFAULT 0,
            created_at REAL DEFAULT (strftime('%s', 'now'))
        )
    """)
    conn.commit()
    conn.close()

# Initialize DB on import
try:
    init_db()
except Exception as e:
    logger.exception(f"Failed to initialize SQLite auth database: {e}")

# In-Memory OTP Store
# Format: { phone: {"otp": otp, "expires_at": expires_at, "user_data": dict} }
PENDING_REGISTRATIONS = {}
PENDING_LOGINS = {}

# ─── Password Helper Functions ────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex() + ":" + pwdhash.hex()

def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        salt_hex, hash_hex = stored_password.split(':')
        salt = bytes.fromhex(salt_hex)
        pwdhash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt, 100000)
        return pwdhash.hex() == hash_hex
    except Exception:
        return False

# ─── Pydantic Schemas ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    phone: str = Field(..., description="10-digit phone number")
    password: str = Field(..., min_length=4, description="User-defined password")
    name: str = Field(..., description="ASHA worker's name")
    state: str = Field(..., description="Indian state")
    district: str = Field(..., description="District")
    asha_id: str | None = Field(None, description="Optional ASHA ID")
    preferred_language: str = Field("hi", description="Preferred language code")

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str

class LoginRequest(BaseModel):
    phone: str
    password: str

# ─── Router Endpoints ─────────────────────────────────────────────────

@router.post("/auth/register")
async def register_user(req: RegisterRequest):
    phone_clean = req.phone.strip().replace(" ", "")
    # Normalize clean phone number: if it doesn't have country code, add +91
    if not phone_clean.startswith("+"):
        if len(phone_clean) == 10:
            phone_clean = "+91" + phone_clean
        else:
            raise HTTPException(status_code=400, detail="Invalid phone format. Enter a 10-digit number.")

    # Check if user already exists and is verified
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone_clean,))
    existing_user = cursor.fetchone()
    conn.close()

    if existing_user:
        if existing_user["verified"] == 1:
            raise HTTPException(status_code=400, detail="Phone number already registered. Please login.")
        # If user exists but is NOT verified, we will allow them to re-register/re-send OTP.

    # Hash the password
    hashed = hash_password(req.password)

    # Generate 6-digit OTP
    otp = generate_otp()
    expires_at = time.time() + 600  # 10 minutes

    # Save to pending registrations memory
    PENDING_REGISTRATIONS[phone_clean] = {
        "otp": otp,
        "expires_at": expires_at,
        "user_data": {
            "phone": phone_clean,
            "password_hash": hashed,
            "name": req.name,
            "asha_id": req.asha_id,
            "state": req.state,
            "district": req.district,
            "preferred_language": req.preferred_language
        }
    }

    # Send the OTP via SMS
    sms_sent = await send_sms_otp(phone_clean, otp)
    
    # In development mode, we can return the OTP so the user can easily copy it if they have no SMS credentials.
    # We will mark it as dev_otp in the response ONLY if SMS gateways are not set.
    dev_otp = otp if (not os.getenv("FAST2SMS_API_KEY") and not os.getenv("TWILIO_ACCOUNT_SID")) else None

    return {
        "success": True,
        "message": "First level authentication successful. OTP sent to mobile number.",
        "phone": phone_clean,
        "dev_otp": dev_otp  # helper for dev testing, null when real credentials exist
    }


@router.post("/auth/register/verify")
async def verify_registration(req: OTPVerifyRequest):
    phone_clean = req.phone.strip()
    if not phone_clean.startswith("+"):
        phone_clean = "+91" + phone_clean

    pending = PENDING_REGISTRATIONS.get(phone_clean)
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found for this number.")

    if time.time() > pending["expires_at"]:
        PENDING_REGISTRATIONS.pop(phone_clean, None)
        raise HTTPException(status_code=400, detail="OTP expired. Please register again.")

    if pending["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # Verification successful! Write user to database
    ud = pending["user_data"]
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Replace or insert
        cursor.execute("""
            INSERT OR REPLACE INTO users 
            (phone, password_hash, name, asha_id, state, district, preferred_language, role, verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'asha_worker', 1)
        """, (ud["phone"], ud["password_hash"], ud["name"], ud["asha_id"], ud["state"], ud["district"], ud["preferred_language"]))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.exception("Failed to write verified user to database:")
        raise HTTPException(status_code=500, detail="Failed to complete user registration.")

    # Remove from pending memory
    PENDING_REGISTRATIONS.pop(phone_clean, None)

    # Generate JWT
    token_payload = {
        "phone": ud["phone"],
        "name": ud["name"],
        "role": "asha_worker",
        "exp": time.time() + 86400 * 30  # 30 days
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        "success": True,
        "token": token,
        "user": {
            "phone": ud["phone"],
            "name": ud["name"],
            "ashaId": ud["asha_id"],
            "state": ud["state"],
            "district": ud["district"],
            "preferredLanguage": ud["preferred_language"],
            "role": "asha_worker"
        }
    }


@router.post("/auth/login")
async def login_user(req: LoginRequest):
    phone_clean = req.phone.strip().replace(" ", "")
    if not phone_clean.startswith("+"):
        if len(phone_clean) == 10:
            phone_clean = "+91" + phone_clean
        else:
            raise HTTPException(status_code=400, detail="Invalid phone format. Enter 10 digits.")

    # Check first level: password verification
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone_clean,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User account not found. Please register first.")

    if not verify_password(user["password_hash"], req.password):
        raise HTTPException(status_code=401, detail="Invalid password. Please try again.")

    # First level successful! Generate secondary OTP
    otp = generate_otp()
    expires_at = time.time() + 600

    PENDING_LOGINS[phone_clean] = {
        "otp": otp,
        "expires_at": expires_at,
        "user_data": {
            "phone": user["phone"],
            "name": user["name"],
            "asha_id": user["asha_id"],
            "state": user["state"],
            "district": user["district"],
            "preferred_language": user["preferred_language"],
            "role": user["role"]
        }
    }

    # Send OTP
    await send_sms_otp(phone_clean, otp)

    dev_otp = otp if (not os.getenv("FAST2SMS_API_KEY") and not os.getenv("TWILIO_ACCOUNT_SID")) else None

    return {
        "success": True,
        "message": "First level password authentication verified. Secondary level OTP sent.",
        "phone": phone_clean,
        "dev_otp": dev_otp
    }


@router.post("/auth/login/verify")
async def verify_login_otp(req: OTPVerifyRequest):
    phone_clean = req.phone.strip()
    if not phone_clean.startswith("+"):
        phone_clean = "+91" + phone_clean

    pending = PENDING_LOGINS.get(phone_clean)
    if not pending:
        raise HTTPException(status_code=400, detail="No pending login session found.")

    if time.time() > pending["expires_at"]:
        PENDING_LOGINS.pop(phone_clean, None)
        raise HTTPException(status_code=400, detail="OTP expired. Please log in again.")

    if pending["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    # Success! Get user profile
    ud = pending["user_data"]
    PENDING_LOGINS.pop(phone_clean, None)

    # Generate JWT
    token_payload = {
        "phone": ud["phone"],
        "name": ud["name"],
        "role": ud["role"],
        "exp": time.time() + 86400 * 30  # 30 days
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return {
        "success": True,
        "token": token,
        "user": {
            "phone": ud["phone"],
            "name": ud["name"],
            "ashaId": ud["asha_id"],
            "state": ud["state"],
            "district": ud["district"],
            "preferredLanguage": ud["preferred_language"],
            "role": ud["role"]
        }
    }

class UpdateProfileRequest(BaseModel):
    phone: str
    password: str | None = None
    name: str | None = None
    state: str | None = None
    district: str | None = None
    asha_id: str | None = None
    preferred_language: str | None = None

@router.post("/auth/update")
async def update_user(req: UpdateProfileRequest):
    phone_clean = req.phone.strip()
    if not phone_clean.startswith("+"):
        phone_clean = "+91" + phone_clean
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone_clean,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found.")
        
    updates = []
    params = []
    
    if req.name is not None:
        updates.append("name = ?")
        params.append(req.name)
    if req.state is not None:
        updates.append("state = ?")
        params.append(req.state)
    if req.district is not None:
        updates.append("district = ?")
        params.append(req.district)
    if req.asha_id is not None:
        updates.append("asha_id = ?")
        params.append(req.asha_id)
    if req.preferred_language is not None:
        updates.append("preferred_language = ?")
        params.append(req.preferred_language)
    if req.password is not None and len(req.password) >= 4:
        updates.append("password_hash = ?")
        params.append(hash_password(req.password))
        
    if not updates:
        conn.close()
        return {"success": True, "message": "No fields to update."}
        
    params.append(phone_clean)
    query = f"UPDATE users SET {', '.join(updates)} WHERE phone = ?"
    cursor.execute(query, tuple(params))
    conn.commit()
    
    # Fetch updated user
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone_clean,))
    updated_user = cursor.fetchone()
    conn.close()
    
    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "phone": updated_user["phone"],
            "name": updated_user["name"],
            "ashaId": updated_user["asha_id"],
            "state": updated_user["state"],
            "district": updated_user["district"],
            "preferredLanguage": updated_user["preferred_language"],
            "role": updated_user["role"]
        }
    }
