import { ReportStatus, ReportType, type CreateReportDto, type Report } from '@/features/reports/types/report.types';

const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockGet = jest.fn();

describe('reportsApi evidence contract', () => {
  const createdReport: Report = {
    id: 'report-shadow-1',
    type: ReportType.SOMBRA,
    description: 'Zona de sombra reportada por la comunidad',
    location: {
      type: 'Point',
      coordinates: [-74.781234, 10.991234],
    },
    status: ReportStatus.ACTIVO,
    profileId: 'profile-1',
    createdAt: '2026-08-03T18:00:00.000Z',
    imageUrl: null,
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.doMock('axios', () => ({
      __esModule: true,
      default: {
        create: jest.fn(() => ({
          get: mockGet,
          patch: mockPatch,
          post: mockPost,
        })),
      },
    }));
    mockPost.mockResolvedValue({ data: createdReport });
    mockPatch.mockResolvedValue({
      data: {
        ...createdReport,
        imageUrl: 'https://xyz.supabase.co/storage/v1/object/public/evidence/report-shadow-1/sombra.jpg',
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['image-bytes'], { type: 'image/jpeg' })),
    }) as jest.Mock;
  });

  it('crea primero el reporte como JSON y luego sube la evidencia como file multipart', async () => {
    const { reportsApi } = require('../reports.api') as typeof import('../reports.api');
    const reportData: CreateReportDto = {
      type: ReportType.SOMBRA,
      description: 'Zona de sombra reportada por la comunidad',
      location: {
        type: 'Point',
        coordinates: [-74.781234, 10.991234],
      },
      evidenceImage: {
        uri: 'blob:http://localhost:8082/sombra',
        fileName: 'sombra.jpg',
        mimeType: 'image/jpeg',
      },
    };

    const report = await reportsApi.create(reportData, 'jwt-token');

    expect(mockPost).toHaveBeenCalledWith(
      '/reports',
      {
        type: ReportType.SOMBRA,
        description: 'Zona de sombra reportada por la comunidad',
        location: {
          type: 'Point',
          coordinates: [-74.781234, 10.991234],
        },
      },
      {
        headers: {
          Authorization: 'Bearer jwt-token',
        },
      }
    );
    expect(global.fetch).toHaveBeenCalledWith('blob:http://localhost:8082/sombra');
    expect(mockPatch).toHaveBeenCalledWith(
      '/reports/report-shadow-1/evidence',
      expect.any(FormData),
      {
        headers: {
          Authorization: 'Bearer jwt-token',
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    expect(report.imageUrl).toContain('/storage/v1/object/public/evidence/');
  });

  it('no intenta subir evidencia cuando el usuario reporta sin foto', async () => {
    const { reportsApi } = require('../reports.api') as typeof import('../reports.api');
    const reportData: CreateReportDto = {
      type: ReportType.SOMBRA,
      description: 'Zona de sombra reportada por la comunidad',
      location: {
        type: 'Point',
        coordinates: [-74.781234, 10.991234],
      },
      evidenceImage: null,
    };

    const report = await reportsApi.create(reportData, 'jwt-token');

    expect(report).toEqual(createdReport);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('configura axios una sola vez con el cliente base', async () => {
    require('../client');
    const axios = require('axios') as typeof import('axios');

    expect(axios.default.create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 15000,
      })
    );
  });
});
