export type AppTab = 'viewer' | 'convert-image' | 'convert-text' | 'image-to-word' | 'security' | 'tools';

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  thumbnailUrl?: string;
  rotation: number;
  nativeText?: string;
  aiText?: string;
  ocrLoading?: boolean;
}

export interface DocumentState {
  file: File | null;
  fileName: string;
  fileSize: number;
  pdfData: Uint8Array | null;
  totalPages: number;
  currentPage: number;
  isPasswordProtected: boolean;
  isEncrypted: boolean;
  activePassword?: string;
}

export interface SecurityOptions {
  userPassword: string;
  confirmPassword: string;
  ownerPassword: string;
  canPrint: boolean;
  canCopy: boolean;
  canModify: boolean;
  canAnnotate: boolean;
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  repeat: boolean;
}

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ImageConvertOptions {
  format: ImageFormat;
  scale: number; // 1 = 72-96 dpi, 2 = 150-200 dpi, 3 = 300 dpi (ultra high)
  quality: number; // 0.1 to 1.0
  allPages: boolean;
}

export type Language = 'km' | 'en';
