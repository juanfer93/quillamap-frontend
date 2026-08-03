import { act, renderHook } from '@testing-library/react-native';
import { reportsApi } from '@/api';
import { TRUTHFUL_REPORT_KARMA_POINTS, useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore } from '@/store/useAuthStore';
import { useCreateReport } from '../hooks/useCreateReport';
import { ReportStatus, ReportType, type CreateReportDto, type Report } from '../types/report.types';

jest.mock('@/api', () => ({
  reportsApi: {
    create: jest.fn(),
  },
}));

const createReportDto: CreateReportDto = {
  type: ReportType.SOMBRA,
  description: 'Zona de sombra reportada por la comunidad',
  location: {
    type: 'Point',
    coordinates: [-74.7889, 10.9878],
  },
};

const createdReport: Report = {
  id: 'shadow-report-1',
  type: ReportType.SOMBRA,
  description: createReportDto.description,
  location: createReportDto.location,
  status: ReportStatus.ACTIVO,
  profileId: 'profile-1',
  createdAt: '2026-07-02T12:00:00.000Z',
};

describe('useCreateReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
    });
    useKarmaRewards.getState().resetKarma();
  });

  it('crea un reporte de sombra enviando el DTO GeoJSON exacto al backend', async () => {
    useAuthStore.setState({
      user: {
        id: 'profile-1',
        full_name: 'Sombra Tester',
        email: 'sombra@test.com',
        mobility_mode: 'peaton',
      },
      session: 'jwt-token',
      isLoading: false,
    });
    jest.mocked(reportsApi.create).mockResolvedValue(createdReport);

    const { result } = renderHook(() => useCreateReport());

    await act(async () => {
      await expect(result.current.createReport(createReportDto)).resolves.toEqual(createdReport);
    });

    expect(reportsApi.create).toHaveBeenCalledWith(createReportDto, 'jwt-token');
    expect(result.current.createdReport).toEqual(createdReport);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isCreating).toBe(false);
    expect(useKarmaRewards.getState().karmaPoints).toBe(TRUTHFUL_REPORT_KARMA_POINTS);
  });

  it('rechaza la creacion cuando no existe sesion autenticada', async () => {
    const { result } = renderHook(() => useCreateReport());

    await act(async () => {
      await expect(result.current.createReport(createReportDto)).rejects.toThrow(
        'Debes iniciar sesion para reportar una zona de sombra'
      );
    });

    expect(reportsApi.create).not.toHaveBeenCalled();
    expect(result.current.errorMessage).toBe('Debes iniciar sesion para reportar una zona de sombra');
  });

  it('cierra la sesion y muestra un mensaje claro cuando el backend responde 401', async () => {
    useAuthStore.setState({
      user: {
        id: 'profile-1',
        full_name: 'Sombra Tester',
        email: 'sombra@test.com',
        mobility_mode: 'peaton',
      },
      session: 'expired-token',
      isLoading: false,
    });
    jest.mocked(reportsApi.create).mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
    });

    const { result } = renderHook(() => useCreateReport());

    await act(async () => {
      await expect(result.current.createReport(createReportDto)).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    expect(result.current.errorMessage).toBe(
      'Tu sesion vencio. Inicia sesion de nuevo para reportar una zona de sombra.'
    );
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
