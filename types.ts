export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  text: string;
  error?: string;
}

export interface UploadedFile {
  dataUrl: string;
  file: File;
}

export enum TabOption {
  TRANSCRIPTION = 'Transcription',
  VISUAL_ANALYSIS = 'Visual Analysis',
  HISTORICAL_CONTEXT = 'Historical Context',
  CHAT = 'Researcher Chat',
}