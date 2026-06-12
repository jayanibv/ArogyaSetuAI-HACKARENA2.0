import os
import math
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

# Health facility hierarchy by severity (verbatim ASHA Module guidelines)
FACILITY_HIERARCHY = {
  "HOME":              { "level": 0, "description": "Home care with ASHA guidance", "radius_km": 0 },
  "SUB_CENTRE":       { "level": 1, "description": "Sub-centre / ASHA centre",      "radius_km": 3 },
  "PHC":              { "level": 2, "description": "Primary Health Centre",          "radius_km": 10 },
  "CHC":              { "level": 3, "description": "Community Health Centre",        "radius_km": 25 },
  "DISTRICT_HOSPITAL":{ "level": 4, "description": "District Hospital",              "radius_km": 60 },
  "MEDICAL_COLLEGE":  { "level": 5, "description": "Medical College Hospital",       "radius_km": 150 },
}

# State-specific naming variations mapping nomenclature (verbatim from specifications)
STATE_FACILITY_NAMES = {
  "Karnataka":         { "PHC": "Primary Health Centre",     "CHC": "Community Health Centre",   "DH": "District Hospital"     },
  "Tamil Nadu":        { "PHC": "Primary Health Centre",     "CHC": "Government Hospital",        "DH": "Government District HQ Hospital" },
  "Maharashtra":       { "PHC": "Primary Health Centre",     "CHC": "Rural Hospital",              "DH": "Civil Hospital"       },
  "Uttar Pradesh":     { "PHC": "Primary Health Centre",     "CHC": "Community Health Centre",   "DH": "District Combined Hospital" },
  "West Bengal":       { "PHC": "Block Primary Health Centre","CHC": "Block Primary Health Centre", "DH": "District Hospital"     },
  "Andhra Pradesh":    { "PHC": "Primary Health Centre",     "CHC": "Area Hospital",              "DH": "Government General Hospital" },
  "Telangana":         { "PHC": "Urban Health Centre",       "CHC": "Area Hospital",              "DH": "Government District Hospital" },
  "Kerala":            { "PHC": "Primary Health Centre",     "CHC": "Taluk Hospital",             "DH": "District Hospital"     },
  "Gujarat":           { "PHC": "Primary Health Centre",     "CHC": "Community Health Centre",   "DH": "General Hospital"      },
  "Rajasthan":         { "PHC": "Primary Health Centre",     "CHC": "Community Health Centre",   "DH": "District Hospital"     },
  "Bihar":             { "PHC": "Additional Primary Health Centre", "CHC": "Referral Hospital",   "DH": "Sadar Hospital"       },
  "Odisha":            { "PHC": "Additional PHC",            "CHC": "Community Health Centre",   "DH": "District Headquarters Hospital" },
  "Assam":             { "PHC": "Primary Health Centre",     "CHC": "Model Hospital",             "DH": "Civil Hospital"       },
  "default":           { "PHC": "Primary Health Centre",     "CHC": "Community Health Centre",   "DH": "District Hospital"     },
}

# Fallback coordinates list representing major health outposts in India
OFFLINE_FACILITY_DATABASE = [
  {"name": "Ramanagara Government Primary Health Centre", "type": "PHC", "state": "Karnataka", "lat": 12.7244, "lng": 77.2844, "phone": "+91-80-2342551", "address": "NH-275 Highway Outpost"},
  {"name": "Channapatna Government Referral CHC", "type": "CHC", "state": "Karnataka", "lat": 12.6512, "lng": 77.2012, "phone": "+91-80-2342552", "address": "Rural Main Outpost"},
  {"name": "Malur Civil District Hospital", "type": "DH", "state": "Karnataka", "lat": 13.0012, "lng": 77.9351, "phone": "+91-81-5122415", "address": "Kolar Main Circle"},
  {"name": "Sitapur District Combined Hospital", "type": "DH", "state": "Uttar Pradesh", "lat": 27.5684, "lng": 80.6784, "phone": "+91-522-841928", "address": "District Circle Main road"},
  {"name": "Sidhauli Primary Health Centre", "type": "PHC", "state": "Uttar Pradesh", "lat": 27.2841, "lng": 80.8251, "phone": "+91-522-841929", "address": "Sidhauli Block Crossing"},
  {"name": "Salem Government District HQ Hospital", "type": "DH", "state": "Tamil Nadu", "lat": 11.6643, "lng": 78.1460, "phone": "+91-427-244192", "address": " Salem Collectorate Junction"},
  {"name": "Araria Sadar Sadar Hospital", "type": "DH", "state": "Bihar", "lat": 26.1509, "lng": 87.4984, "phone": "+91-6453-222301", "address": "Sadar Hospital Road Crossing"}
]

# Haversine distance calculator for offline metrics
def compute_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c * 1.3, 1) # 1.3 routing offset factor for winding rural roads

@router.get("/facilities")
async def get_facilities(
    lat: float = Query(..., description="ASHA worker GPS latitude"),
    lng: float = Query(..., description="ASHA worker GPS longitude"),
    severity: str = Query(..., description="Triaged risk severity: LOW, MEDIUM, HIGH, EMERGENCY"),
    state: str = Query(..., description="Indian state name")
):
    if severity not in ["LOW", "MEDIUM", "HIGH", "EMERGENCY"]:
        raise HTTPException(status_code=400, detail="Invalid severity. Must be LOW, MEDIUM, HIGH, EMERGENCY.")

    # Determine facility hierarchy level and search radius
    level = {"LOW": "SUB_CENTRE", "MEDIUM": "PHC", "HIGH": "CHC", "EMERGENCY": "DISTRICT_HOSPITAL"}[severity]
    radius = FACILITY_HIERARCHY[level]["radius_km"] * 1000
    
    # Safely resolve state key nomenclature map (SUB_CENTRE maps to PHC, DISTRICT_HOSPITAL to DH)
    level_key = {
        "SUB_CENTRE": "PHC",
        "PHC": "PHC",
        "CHC": "CHC",
        "DISTRICT_HOSPITAL": "DH"
    }.get(level, "PHC")
    
    facility_name = STATE_FACILITY_NAMES.get(state, STATE_FACILITY_NAMES["default"]).get(level_key, "Primary Health Centre")

    # Check for active Google Maps API integration key
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if GOOGLE_MAPS_API_KEY:
        try:
            url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius}&keyword={facility_name}&type=hospital&key={GOOGLE_MAPS_API_KEY}"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])[:3]
                    out = []
                    for r in results:
                        plat = r.get("geometry", {}).get("location", {}).get("lat", lat)
                        plng = r.get("geometry", {}).get("location", {}).get("lng", lng)
                        dist_val = compute_distance(lat, lng, plat, plng)
                        out.append({
                            "name": r.get("name", facility_name),
                            "address": r.get("vicinity", "Government Health Outpost"),
                            "phone": "+91-108-EMERGENCY",
                            "distance_km": dist_val,
                            "lat": plat,
                            "lng": plng,
                            "open_now": r.get("opening_hours", {}).get("open_now", True),
                            "emergency_24hr": level == "DISTRICT_HOSPITAL"
                        })
                    return out
        except Exception as e:
            print(f"[GOOGLE MAPS ERROR] Maps API call failed: {str(e)}. Falling back to offline Haversine databases.")

    # High-Performance Offline Haversine Fallback mapping
    matched_facilities = []
    for fac in OFFLINE_FACILITY_DATABASE:
        # Distance calculation
        dist = compute_distance(lat, lng, fac["lat"], fac["lng"])
        # Map nomenclature dynamically based on state
        state_names = STATE_FACILITY_NAMES.get(fac["state"], STATE_FACILITY_NAMES["default"])
        mapped_name = fac["name"]
        
        # Override name dynamically if requested by state
        if fac["type"] == "PHC" and "PHC" in state_names:
            mapped_name = fac["name"].replace("Primary Health Centre", state_names["PHC"])
        elif fac["type"] == "CHC" and "CHC" in state_names:
            mapped_name = fac["name"].replace("Community Health Centre", state_names["CHC"])
        elif fac["type"] == "DH" and "DH" in state_names:
            mapped_name = fac["name"].replace("District Hospital", state_names["DH"])

        matched_facilities.append({
            "name": mapped_name,
            "address": fac["address"],
            "phone": fac["phone"],
            "distance_km": dist,
            "lat": fac["lat"],
            "lng": fac["lng"],
            "open_now": True,
            "emergency_24hr": level == "DISTRICT_HOSPITAL"
        })

    # Sort nearest first and return top 3
    matched_facilities.sort(key=lambda x: x["distance_km"])
    return matched_facilities[:3]
