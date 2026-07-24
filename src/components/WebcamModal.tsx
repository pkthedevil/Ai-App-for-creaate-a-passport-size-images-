import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageFile: File) => void;
}

export const WebcamModal: React.FC<WebcamModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      return;
    }

    async function enableCamera() {
      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setError('Camera permission denied or camera unavailable.');
      }
    }

    enableCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `Webcam_Studio_Photo_${Date.now()}.jpeg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl text-zinc-100">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Live Camera Capture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center justify-center bg-zinc-950 relative min-h-[320px]">
          {error ? (
            <div className="text-rose-400 text-xs text-center p-6">{error}</div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 max-h-[360px] w-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full object-cover transform -scale-x-100"
              />

              {/* Live Passport Face Alignment Mask */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                <div className="text-[10px] text-indigo-300 font-mono text-center bg-zinc-950/60 py-1 px-3 rounded-full border border-indigo-500/20 backdrop-blur-xs">
                  POSITION HEAD INSIDE OVAL • LOOK STRAIGHT AT CAMERA
                </div>
                <div className="mx-auto my-auto w-[45%] h-[65%] rounded-[50%] border-2 border-dashed border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.25)]"></div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleTakePhoto}
            disabled={!!error}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
