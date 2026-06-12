import os
import random
import logging
import httpx

logger = logging.getLogger("aarogyasetu.sms")

# Try to get API keys from environment
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

def generate_otp() -> str:
    """Generate a random 6-digit numeric OTP."""
    return f"{random.randint(100000, 999999)}"

async def send_sms_otp(phone: str, otp: str) -> bool:
    """
    Send an OTP SMS to a phone number.
    Supports Fast2SMS (Indian gateway) and Twilio (Global gateway).
    Falls back to console printing for development mode.
    """
    # Clean phone number (e.g. remove +91 prefix for Fast2SMS if needed, or format for Twilio)
    # Fast2SMS typically expects 10-digit mobile number, Twilio expects E.164 (+91...)
    cleaned_phone_10dig = phone[-10:]
    e164_phone = phone if phone.startswith("+") else f"+91{phone}"

    message_body = f"Your AarogyaSetu AI verification OTP is: {otp}. Valid for 10 minutes."

    # Try Fast2SMS First (Popular in India)
    if FAST2SMS_API_KEY:
        try:
            logger.info(f"Sending OTP via Fast2SMS to {cleaned_phone_10dig}")
            # Fast2SMS V2 OTP API
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "route": "otp",
                "variables_values": otp,
                "numbers": cleaned_phone_10dig
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    res_json = response.json()
                    if res_json.get("return") is True:
                        logger.info(f"Fast2SMS: OTP sent successfully to {cleaned_phone_10dig}")
                        return True
                    else:
                        logger.error(f"Fast2SMS returned error response: {res_json}")
                else:
                    logger.error(f"Fast2SMS API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.exception(f"Failed to send SMS via Fast2SMS: {str(e)}")

    # Try Twilio Second
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        try:
            logger.info(f"Sending OTP via Twilio to {e164_phone}")
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            data = {
                "From": TWILIO_FROM_NUMBER,
                "To": e164_phone,
                "Body": message_body
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, data=data, auth=auth, timeout=10.0)
                if response.status_code in [200, 201]:
                    logger.info(f"Twilio: OTP sent successfully to {e164_phone}")
                    return True
                else:
                    logger.error(f"Twilio API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.exception(f"Failed to send SMS via Twilio: {str(e)}")

    # Fallback/Dev Mode
    logger.warning("==================================================")
    logger.warning(f"  [DEV MODE OTP] Phone: {phone} | OTP: {otp}  ")
    logger.warning("  SMS gateway credentials not configured.         ")
    logger.warning("  Configure FAST2SMS_API_KEY or TWILIO credentials ")
    logger.warning("  in the backend environment or .env file.         ")
    logger.warning("==================================================")
    
    # We return True in development so users can test the authentication flow even without keys
    return True
