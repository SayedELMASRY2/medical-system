export type RiskLevel = "high" | "clinical_review" | "monitor" | "low";

export interface PatientVital {
  bloodPressure: string; // e.g. "120/80"
  weight: number; // kg
  heartRate?: number;
  recordedAt: string; // ISO datetime
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gestationalAgeWeeks: number;
  riskLevel: RiskLevel;
  latestVitals?: PatientVital;
  lastCheckInAt: string; // ISO datetime
  clinicalTrendSummary: string; // Brief AI generated trend summary
  symptoms?: string[];
}

export interface DashboardSummary {
  totalPatients: number;
  highPriorityCount: number;
  clinicalReviewCount: number;
  monitoringCount: number;
}
