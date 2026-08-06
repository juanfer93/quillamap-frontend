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

  it('consume el contrato anonimo del mapa de calor de seguridad', async () => {
    const securityHeatmap = {
      generatedAt: '2026-08-04T12:00:00.000Z',
      windowMinutes: 60,
      dbscanRadiusMeters: 804.672,
      minReportsPerCluster: 3,
      metadata: {
        primaryColor: '#004574',
        touristSafetyMilestoneColor: '#D4AF37',
      },
      points: [
        {
          clusterId: 'security-cluster-1',
          latitude: 10.9878,
          longitude: -74.7889,
          intensity: 0.92,
          dangerLevel: 5,
          veracityScore: 0.87,
          reportCount: 8,
          radiusMeters: 420,
          riskLevel: 'critical',
          hasVerifiedEvidence: true,
          generatedFrom: '2026-08-04T11:00:00.000Z',
          generatedTo: '2026-08-04T12:00:00.000Z',
        },
      ],
    };
    mockGet.mockResolvedValueOnce({ data: securityHeatmap });
    const { reportsApi } = require('../reports.api') as typeof import('../reports.api');

    const response = await reportsApi.findSecurityHeatmap({
      lat: 10.9878,
      lng: -74.7889,
      radius: 2000,
      criticalOnly: true,
      proximityRadius: 500,
    });

    expect(mockGet).toHaveBeenCalledWith('/reports/heatmap/security', {
      params: {
        lat: 10.9878,
        lng: -74.7889,
        radius: 2000,
        criticalOnly: true,
        proximityRadius: 500,
      },
    });
    expect(response.points[0]).not.toHaveProperty('user_id');
    expect(response.points[0]).toMatchObject({
      clusterId: 'security-cluster-1',
      veracityScore: 0.87,
    });
  });

  it('limita el radio del heatmap de seguridad a 5000m antes de llamar al backend', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        generatedAt: '2026-08-04T12:00:00.000Z',
        windowMinutes: 60,
        dbscanRadiusMeters: 804.672,
        minReportsPerCluster: 3,
        metadata: {
          primaryColor: '#004574',
          touristSafetyMilestoneColor: '#D4AF37',
        },
        points: [],
      },
    });
    const { reportsApi } = require('../reports.api') as typeof import('../reports.api');

    await reportsApi.findSecurityHeatmap({
      lat: 10.9878,
      lng: -74.7889,
      radius: 9000,
      criticalOnly: true,
      proximityRadius: 800,
    });

    expect(mockGet).toHaveBeenCalledWith('/reports/heatmap/security', {
      params: {
        lat: 10.9878,
        lng: -74.7889,
        radius: 5000,
        criticalOnly: true,
        proximityRadius: 500,
      },
    });
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
