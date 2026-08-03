import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useReportStore } from '../store/useReportStore';
import { REPORT_EVIDENCE_IMAGE_QUALITY } from '../constants/report-evidence.constants';
import type { ReportEvidenceImage } from '../types/report.types';

const toReportEvidenceImage = (asset: ImagePicker.ImagePickerAsset): ReportEvidenceImage => ({
  uri: asset.uri,
  fileName: asset.fileName,
  mimeType: asset.mimeType,
});

interface ReportEvidenceState {
  requestCameraPermission: () => Promise<boolean>;
  capturePhoto: () => Promise<ReportEvidenceImage | null>;
  pickFromGallery: () => Promise<ReportEvidenceImage | null>;
}

export const useReportEvidence = (): ReportEvidenceState => {
  const setEvidenceImage = useReportStore((state) => state.setEvidenceImage);

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    return permission.granted;
  }, []);

  const capturePhoto = useCallback(async (): Promise<ReportEvidenceImage | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: REPORT_EVIDENCE_IMAGE_QUALITY,
      exif: false,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const image = toReportEvidenceImage(result.assets[0]);
    setEvidenceImage(image);
    return image;
  }, [setEvidenceImage]);

  const pickFromGallery = useCallback(async (): Promise<ReportEvidenceImage | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: REPORT_EVIDENCE_IMAGE_QUALITY,
      exif: false,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const image = toReportEvidenceImage(result.assets[0]);
    setEvidenceImage(image);
    return image;
  }, [setEvidenceImage]);

  return {
    requestCameraPermission,
    capturePhoto,
    pickFromGallery,
  };
};
