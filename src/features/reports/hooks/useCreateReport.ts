import { useCallback, useState } from 'react';
import axios from 'axios';
import { reportsApi } from '@/api';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore } from '@/store/useAuthStore';
import type { CreateReportDto, Report } from '../types/report.types';

interface CreateReportState {
  createdReport: Report | null;
  errorMessage: string | null;
  isCreating: boolean;
  createReport: (reportData: CreateReportDto) => Promise<Report>;
  reset: () => void;
}

const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;

const getErrorMessage = (error: unknown): string => {
  if (isUnauthorizedError(error)) {
    return 'Tu sesion vencio. Inicia sesion de nuevo para reportar una zona de sombra.';
  }

  return error instanceof Error ? error.message : 'No se pudo crear el reporte';
};

export const useCreateReport = (): CreateReportState => {
  const accessToken = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createReport = useCallback(
    async (reportData: CreateReportDto) => {
      if (!accessToken) {
        const error = new Error('Debes iniciar sesion para reportar una zona de sombra');
        setErrorMessage(error.message);
        throw error;
      }

      setIsCreating(true);
      setErrorMessage(null);

      try {
        const report = await reportsApi.create(reportData, accessToken);
        useKarmaRewards.getState().awardTruthfulReport();
        setCreatedReport(report);
        return report;
      } catch (error) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        if (isUnauthorizedError(error)) {
          void signOut();
        }
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [accessToken, signOut]
  );

  const reset = useCallback(() => {
    setCreatedReport(null);
    setErrorMessage(null);
    setIsCreating(false);
  }, []);

  return {
    createdReport,
    errorMessage,
    isCreating,
    createReport,
    reset,
  };
};
