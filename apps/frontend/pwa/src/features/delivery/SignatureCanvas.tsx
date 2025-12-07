import React, { useRef, useCallback, useState } from 'react';

interface SignatureCanvasProps {
  onSignatureChange: (signatureBase64: string | null) => void;
  width?: number;
  height?: number;
}

/**
 * A canvas-based digital signature component.
 * Captures the user's signature and exports it as Base64 PNG.
 */
export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  width = 320,
  height = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in event) {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  };

  const startDrawing = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const coords = getCoordinates(event);
      if (!coords) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    },
    [],
  );

  const draw = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (!isDrawing) return;

      const coords = getCoordinates(event);
      if (!coords) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      setHasSignature(true);
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && hasSignature) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signatureBase64 = canvas.toDataURL('image/png');
        onSignatureChange(signatureBase64);
      }
    }
    setIsDrawing(false);
  }, [isDrawing, hasSignature, onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="signature-canvas-container">
      <label className="signature-label">📝 Firma del receptor</label>
      <div className="signature-border">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="signature-actions">
        <button
          type="button"
          onClick={clearSignature}
          className="clear-signature-button"
          disabled={!hasSignature}
        >
          Limpiar firma
        </button>
        {hasSignature && <span className="signature-status">✓ Firma capturada</span>}
      </div>
      <style>{`
        .signature-canvas-container {
          margin-bottom: 1rem;
        }
        .signature-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        .signature-border {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          display: inline-block;
          background: #fafafa;
        }
        .signature-canvas {
          display: block;
          cursor: crosshair;
          touch-action: none;
        }
        .signature-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .clear-signature-button {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .clear-signature-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .signature-status {
          color: #22c55e;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default SignatureCanvas;
