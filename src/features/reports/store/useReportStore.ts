import { create } from 'zustand';
import type { ReportEvidenceImage, ReportType } from '../types/report.types';

interface ReportStoreState {
  activeReportType: ReportType | null;
  evidenceImage: ReportEvidenceImage | null;
  isUploading: boolean;
  setActiveReportType: (type: ReportType | null) => void;
  setEvidenceImage: (image: ReportEvidenceImage | null) => void;
  setIsUploading: (isUploading: boolean) => void;
  startReportDraft: (type: ReportType) => void;
  resetEvidence: () => void;
  resetReportDraft: () => void;
}

export const useReportStore = create<ReportStoreState>((set) => ({
  activeReportType: null,
  evidenceImage: null,
  isUploading: false,
  setActiveReportType: (type) => set({ activeReportType: type }),
  setEvidenceImage: (image) => set({ evidenceImage: image }),
  setIsUploading: (isUploading) => set({ isUploading }),
  startReportDraft: (type) => set({ activeReportType: type, evidenceImage: null, isUploading: false }),
  resetEvidence: () => set({ evidenceImage: null, isUploading: false }),
  resetReportDraft: () => set({ activeReportType: null, evidenceImage: null, isUploading: false }),
}));
