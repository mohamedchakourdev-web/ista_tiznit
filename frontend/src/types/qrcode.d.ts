declare module 'qrcode' {
  export interface QRCodeToStringOptions {
    type?: 'svg' | 'utf8' | 'terminal';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
  export function toDataURL(text: string, options?: QRCodeToStringOptions): Promise<string>;

  const QRCode: {
    toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
    toDataURL(text: string, options?: QRCodeToStringOptions): Promise<string>;
  };

  export default QRCode;
}
