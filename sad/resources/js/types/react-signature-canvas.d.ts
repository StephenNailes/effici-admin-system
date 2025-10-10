declare module 'react-signature-canvas' {
  import * as React from 'react';
  export interface SignatureCanvasProps {
    penColor?: string;
    backgroundColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    throttle?: number;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement> & { width?: number; height?: number };
    clearOnResize?: boolean;
    onBegin?: () => void;
    onEnd?: () => void;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    fromDataURL(base64: string, options?: { ratio?: number; width?: number; height?: number; xOffset?: number; yOffset?: number }): void;
    toDataURL(type?: string, encoderOptions?: any): string;
    isEmpty(): boolean;
    off(): void;
    on(): void;
  }
}
