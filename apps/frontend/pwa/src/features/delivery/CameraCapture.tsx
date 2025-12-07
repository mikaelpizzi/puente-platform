import React, { useRef, useState, useCallback } from 'react';

interface CameraCaptureProps {
  onPhotoCapture: (photoBase64: string | null) => void;
}

/**
 * Camera capture component using MediaDevices API.
 * Captures a photo from the device camera and exports as Base64.
 */
export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsActive(true);
      setCapturedPhoto(null);
      onPhotoCapture(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, [onPhotoCapture]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoBase64);
    onPhotoCapture(photoBase64);
    stopCamera();
  }, [onPhotoCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    onPhotoCapture(null);
    startCamera();
  }, [onPhotoCapture, startCamera]);

  return (
    <div className="camera-capture-container">
      <label className="camera-label">📷 Foto de entrega</label>

      {error && <div className="camera-error">{error}</div>}

      {!isActive && !capturedPhoto && (
        <button type="button" onClick={startCamera} className="start-camera-button">
          Abrir cámara
        </button>
      )}

      {isActive && (
        <div className="camera-active">
          <video ref={videoRef} autoPlay playsInline muted className="camera-preview" />
          <div className="camera-controls">
            <button type="button" onClick={capturePhoto} className="capture-button">
              📸 Capturar
            </button>
            <button type="button" onClick={stopCamera} className="cancel-button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {capturedPhoto && (
        <div className="captured-photo">
          <img src={capturedPhoto} alt="Foto capturada" className="photo-preview" />
          <div className="photo-actions">
            <button type="button" onClick={retakePhoto} className="retake-button">
              Tomar otra
            </button>
            <span className="photo-status">✓ Foto capturada</span>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <style>{`
        .camera-capture-container {
          margin-bottom: 1rem;
        }
        .camera-label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1a1a2e;
        }
        .camera-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }
        .start-camera-button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        }
        .start-camera-button:hover {
          background: linear-gradient(135deg, #5658e5, #7c3aed);
        }
        .camera-active {
          position: relative;
        }
        .camera-preview {
          width: 100%;
          max-width: 400px;
          border-radius: 8px;
          background: #000;
        }
        .camera-controls {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .capture-button {
          flex: 1;
          padding: 0.75rem;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        }
        .cancel-button {
          padding: 0.75rem 1rem;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 8px;
          cursor: pointer;
        }
        .captured-photo {
          max-width: 400px;
        }
        .photo-preview {
          width: 100%;
          border-radius: 8px;
          border: 2px solid #22c55e;
        }
        .photo-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .retake-button {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .photo-status {
          color: #22c55e;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;
