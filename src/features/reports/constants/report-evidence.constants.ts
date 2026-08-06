import { ReportType, type ReportTypeOption } from '../types/report.types';

export const REPORT_EVIDENCE_IMAGE_QUALITY = 0.7;
export const REPORT_EVIDENCE_MAX_WIDTH = 1280;

export const REPORT_EVIDENCE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

export const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    type: ReportType.SOMBRA,
    label: 'Sombra',
    description: 'Zona de sombra util para caminar con menos calor',
    defaultDescription: 'Zona de sombra reportada por la comunidad',
    evidencePrompt: 'Quieres adjuntar una evidencia de que hay una sombra?',
    evidenceRequired: false,
  },
  {
    type: ReportType.ARROYO,
    label: 'Arroyo',
    description: 'Corriente de agua o arroyo activo que afecta la via',
    defaultDescription: 'Arroyo activo reportado por la comunidad',
    evidencePrompt: 'Quieres adjuntar una evidencia del arroyo?',
    evidenceRequired: false,
  },
  {
    type: ReportType.BACHE,
    label: 'Bache',
    description: 'Hueco o deterioro del pavimento',
    defaultDescription: 'Bache reportado por la comunidad',
    evidencePrompt: 'Quieres adjuntar una evidencia del bache?',
    evidenceRequired: false,
  },
  {
    type: ReportType.INSEGURIDAD,
    label: 'Zona peligrosa',
    description: 'Lugar donde la comunidad reporta riesgo de seguridad',
    defaultDescription: 'Zona peligrosa reportada por la comunidad',
    evidencePrompt: 'Quieres adjuntar una evidencia de la zona peligrosa?',
    evidenceRequired: false,
  },
];

export const getReportTypeOption = (type: ReportType): ReportTypeOption =>
  REPORT_TYPE_OPTIONS.find((option) => option.type === type) ?? {
    type,
    label: 'Reporte',
    description: 'Reporte ciudadano',
    defaultDescription: 'Reporte ciudadano creado por la comunidad',
    evidencePrompt: 'Quieres adjuntar una evidencia?',
    evidenceRequired: false,
  };
