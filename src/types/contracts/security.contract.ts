export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const DEFAULT_SECURITY_RISK_LABELS: Record<SecurityRiskLevel, string> = {
  low: 'Bajo',
  medium: 'Moderado',
  high: 'Peligroso',
  critical: 'Muy peligroso',
};

export interface SecurityHeatmapMetadataContract {
  primaryColor: '#004574';
  touristSafetyMilestoneColor: '#D4AF37';
  riskLabels?: Partial<Record<SecurityRiskLevel, string>>;
}

export interface SecurityHeatmapPointContract {
  clusterId: string;
  latitude: number;
  longitude: number;
  intensity: number;
  dangerLevel: number;
  veracityScore: number;
  reportCount: number;
  radiusMeters: number;
  riskLevel: SecurityRiskLevel;
  hasVerifiedEvidence: boolean;
  generatedFrom: string;
  generatedTo: string;
}

export interface SecurityHeatmapResponseContract {
  generatedAt: string;
  windowMinutes: number;
  dbscanRadiusMeters: number;
  minReportsPerCluster: number;
  metadata: SecurityHeatmapMetadataContract;
  points: SecurityHeatmapPointContract[];
}

export interface SecurityHeatmapRequestContract {
  lat: number;
  lng: number;
  radius?: number;
  criticalOnly?: boolean;
  proximityRadius?: number;
}
