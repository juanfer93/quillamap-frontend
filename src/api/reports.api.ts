import client from './client';
import type { CreateReportDto, Report } from '@/features/reports/types/report.types';
import type {
  SecurityHeatmapRequestContract,
  SecurityHeatmapResponseContract,
} from '@/types/contracts/security.contract';

export const SECURITY_HEATMAP_MAX_RADIUS_METERS = 5_000;
export const SECURITY_HEATMAP_MIN_PROXIMITY_RADIUS_METERS = 300;
export const SECURITY_HEATMAP_MAX_PROXIMITY_RADIUS_METERS = 500;

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const normalizeSecurityHeatmapParams = (
  params: SecurityHeatmapRequestContract
): SecurityHeatmapRequestContract => ({
  ...params,
  radius: typeof params.radius === 'number'
    ? Math.min(params.radius, SECURITY_HEATMAP_MAX_RADIUS_METERS)
    : params.radius,
  proximityRadius: typeof params.proximityRadius === 'number'
    ? clampNumber(
      params.proximityRadius,
      SECURITY_HEATMAP_MIN_PROXIMITY_RADIUS_METERS,
      SECURITY_HEATMAP_MAX_PROXIMITY_RADIUS_METERS
    )
    : params.proximityRadius,
});

const getReportEvidenceFileName = (image: NonNullable<CreateReportDto['evidenceImage']>): string => {
  if (image.fileName) {
    return image.fileName;
  }

  const uriFileName = image.uri.split('/').pop();
  if (uriFileName?.includes('.')) {
    return uriFileName;
  }

  const mimeType = image.mimeType ?? 'image/jpeg';
  return `evidence.${mimeType.split('/').pop() ?? 'jpg'}`;
};

const isBrowserFormDataRuntime = (): boolean =>
  typeof window !== 'undefined' && typeof Blob !== 'undefined';

const appendReportEvidenceFile = async (
  formData: FormData,
  evidenceImage: NonNullable<CreateReportDto['evidenceImage']>
): Promise<void> => {
  const fileName = getReportEvidenceFileName(evidenceImage);
  const mimeType = evidenceImage.mimeType ?? 'image/jpeg';

  if (isBrowserFormDataRuntime()) {
    const response = await fetch(evidenceImage.uri);
    const blob = await response.blob();
    const file = typeof File !== 'undefined'
      ? new File([blob], fileName, { type: mimeType })
      : blob;

    formData.append('file', file, fileName);
    return;
  }

  formData.append('file', {
    uri: evidenceImage.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
};

export const reportsApi = {
  create: async (reportData: CreateReportDto, accessToken: string): Promise<Report> => {
    const { evidenceImage, ...reportPayload } = reportData;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await client.post<Report>('/reports', reportPayload, { headers });

    if (!evidenceImage) {
      return response.data;
    }

    return reportsApi.uploadEvidence(response.data.id, evidenceImage, accessToken);
  },

  uploadEvidence: async (
    reportId: string,
    evidenceImage: NonNullable<CreateReportDto['evidenceImage']>,
    accessToken: string
  ): Promise<Report> => {
    const formData = new FormData();
    await appendReportEvidenceFile(formData, evidenceImage);

    const response = await client.patch<Report>(`/reports/${reportId}/evidence`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  findNearby: async (params: { lat: number; lng: number; radius?: number }): Promise<Report[]> => {
    const response = await client.get<Report[]>('/reports', { params });
    return response.data;
  },

  findSecurityHeatmap: async (
    params: SecurityHeatmapRequestContract
  ): Promise<SecurityHeatmapResponseContract> => {
    const response = await client.get<SecurityHeatmapResponseContract>('/reports/heatmap/security', {
      params: normalizeSecurityHeatmapParams(params),
    });
    return response.data;
  },
};
