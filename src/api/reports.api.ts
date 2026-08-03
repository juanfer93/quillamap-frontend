import client from './client';
import type { CreateReportDto, Report } from '@/features/reports/types/report.types';

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
};
