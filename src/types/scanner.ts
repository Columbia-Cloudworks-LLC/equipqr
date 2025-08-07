export interface ScannerError {
  message: string;
  code?: string;
  name?: string;
}

export interface QRScannerComponentProps {
  onScan: (result: string) => void;
  onError: (error: ScannerError) => void;
}