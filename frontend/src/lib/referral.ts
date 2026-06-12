interface PatientDetails {
  name: string;
  age: string;
  sex: string;
  village: string;
  district: string;
  symptoms: string;
}

interface TriageResult {
  severity: string;
  likely_condition: string;
  immediate_actions: string[];
}

interface FacilityDetails {
  name: string;
  phone: string;
  address: string;
  distance_km: number;
}

/**
 * Generates the WhatsApp shareable text format for ASHA workers.
 * Tailored specifically for immediate sharing with doctors or health officials.
 */
export function buildWhatsAppReferral(
  triage: TriageResult,
  patient: PatientDetails,
  facility: FacilityDetails,
  ashaName: string
): string {
  return `🏥 *AarogyaSetu Referral*
📅 ${new Date().toLocaleDateString('en-IN')}

👤 *Patient:* ${patient.name}, ${patient.age}y, ${patient.sex}
📍 *Village:* ${patient.village}, ${patient.district}

🩺 *Reported symptoms:* ${patient.symptoms}

⚠️ *Severity:* ${triage.severity}
📋 *Assessment:* ${triage.likely_condition}

✅ *Immediate steps:*
${triage.immediate_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

🏥 *Refer to:* ${facility.name}
📞 ${facility.phone}
📍 ${facility.address} (${facility.distance_km.toFixed(1)} km)

🆘 Emergency: 108 | 112
👩‍⚕️ ASHA: ${ashaName}

_AI-assisted screening. Confirm with doctor._`;
}
