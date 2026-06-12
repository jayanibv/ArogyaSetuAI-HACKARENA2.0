export interface PatientRecord {
  id: string;
  name: string;
  age: string;
  gender: string;
  village: string;
  symptoms: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  actionSteps: string[];
  referralId: string;
  timestamp: string;
  synced: boolean;
}

// Global Rule #2: Mask PHI in all telemetry, diagnostics, and plaintext logs
export function maskPHI(record: PatientRecord): PatientRecord {
  const maskName = (val: string) => {
    if (!val) return '***';
    if (val.length <= 2) return val.charAt(0) + '*';
    return val.charAt(0) + '*'.repeat(val.length - 2) + val.charAt(val.length - 1);
  };

  const maskVillage = (val: string) => {
    if (!val) return '***';
    return val.charAt(0) + '***';
  };

  return {
    ...record,
    name: maskName(record.name),
    village: maskVillage(record.village),
    // Mask exact age by grouping into approximate cohorts
    age: record.age ? `${Math.floor(parseInt(record.age) / 10) * 10}s` : 'unknown'
  };
}

// Logging helper ensuring zero leak of raw inputs
export function logTriageTelemetry(record: PatientRecord) {
  const masked = maskPHI(record);
  console.log(`%c[ASHA-TELEMETRY] Secure Triage Recorded %cID: ${masked.referralId} | Age: ${masked.age} | Village: ${masked.village} | Severity: ${masked.severity}`, 
    "color: #F59E0B; font-weight: bold", 
    "color: #10B981"
  );
}

const STORAGE_KEY = 'aarogyasetu_triage_sessions';

export const offlineStorage = {
  // Retrieve cached records
  getRecords(): PatientRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Local storage error:", e);
      return [];
    }
  },

  // Save record and enforce maximum 10 sessions cache limit
  saveRecord(record: PatientRecord): PatientRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const records = this.getRecords();
      
      // Prepend to show newest first
      const updated = [record, ...records];
      
      // Enforce Offline-first: cache last 10 triage sessions in IndexedDB/Storage
      const sliced = updated.slice(0, 10);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
      
      // Log telemetry with masked PHI
      logTriageTelemetry(record);
      
      return sliced;
    } catch (e) {
      console.error("Local save error:", e);
      return [];
    }
  },

  // Update status (e.g. when synced online)
  markAsSynced(id: string): PatientRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const records = this.getRecords();
      const updated = records.map(r => r.id === id ? { ...r, synced: true } : r);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  }
};
