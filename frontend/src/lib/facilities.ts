export const FACILITY_HIERARCHY = {
  "HOME":              { level: 0, description: "Home care with ASHA guidance", radius_km: 0 },
  "SUB_CENTRE":       { level: 1, description: "Sub-centre / ASHA centre",      radius_km: 3 },
  "PHC":              { level: 2, description: "Primary Health Centre",          radius_km: 10 },
  "CHC":              { level: 3, description: "Community Health Centre",        radius_km: 25 },
  "DISTRICT_HOSPITAL":{ level: 4, description: "District Hospital",              radius_km: 60 },
  "MEDICAL_COLLEGE":  { level: 5, description: "Medical College Hospital",       radius_km: 150 },
};

export const STATE_FACILITY_NAMES = {
  "Karnataka":         { PHC: "Primary Health Centre",     CHC: "Community Health Centre",   DH: "District Hospital"     },
  "Tamil Nadu":        { PHC: "Primary Health Centre",     CHC: "Government Hospital",        DH: "Government District HQ Hospital" },
  "Maharashtra":       { PHC: "Primary Health Centre",     CHC: "Rural Hospital",              DH: "Civil Hospital"       },
  "Uttar Pradesh":     { PHC: "Primary Health Centre",     CHC: "Community Health Centre",   DH: "District Combined Hospital" },
  "West Bengal":       { PHC: "Block Primary Health Centre",CHC: "Block Primary Health Centre", DH: "District Hospital"     },
  "Andhra Pradesh":    { PHC: "Primary Health Centre",     CHC: "Area Hospital",              DH: "Government General Hospital" },
  "Telangana":         { PHC: "Urban Health Centre",       CHC: "Area Hospital",              DH: "Government District Hospital" },
  "Kerala":            { PHC: "Primary Health Centre",     CHC: "Taluk Hospital",             DH: "District Hospital"     },
  "Gujarat":           { PHC: "Primary Health Centre",     CHC: "Community Health Centre",   DH: "General Hospital"      },
  "Rajasthan":         { PHC: "Primary Health Centre",     CHC: "Community Health Centre",   DH: "District Hospital"     },
  "Bihar":             { PHC: "Additional Primary Health Centre", CHC: "Referral Hospital",   DH: "Sadar Hospital"       },
  "Odisha":            { PHC: "Additional PHC",            CHC: "Community Health Centre",   DH: "District Headquarters Hospital" },
  "Assam":             { PHC: "Primary Health Centre",     CHC: "Model Hospital",             DH: "Civil Hospital"       },
  "default":           { PHC: "Primary Health Centre",     CHC: "Community Health Centre",   DH: "District Hospital"     },
};

export const EMERGENCY_NUMBERS = {
  national: { ambulance: "108", police: "100", general: "112" },
  state_specific: {
    "Andhra Pradesh": { ambulance: "108", women_helpline: "181" },
    "Karnataka":      { ambulance: "108", arogya_setu_helpline: "104" },
    "Tamil Nadu":     { ambulance: "108", cm_helpline: "1100" },
    "Kerala":         { ambulance: "108", medical_helpline: "104" },
    "Uttar Pradesh":  { ambulance: "108", cm_helpline: "1076" },
    "UP":             { ambulance: "108", cm_helpline: "1076" },
    "default":        { ambulance: "108", general_emergency: "112" },
  }
};
