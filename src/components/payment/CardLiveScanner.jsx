import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X, ScanLine, CheckCircle2 } from 'lucide-react';
import {
  analyzeCardFrame,
  drawCardGuide,
  scanCardFromCanvas,
} from '@/utils/cardScan';

const STABLE_FRAMES = 14;
const ANALYSIS_W = 320;
const ANALYSIS_H = 200;

export default function CardLiveScanner({ open, onClose, onScan }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const rafRef = useRef(null);
  const stableCountRef = useRef(0);
  const lastAvgRef = useRef(null);
  const capturingRef = useRef(false);

  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [aligned, setAligned] = useState(false);
  const [hint, setHint] = useState('Kartı çerçeveye yerleştirin');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stableCountRef.current = 0;
    lastAvgRef.current = null;
    capturingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const runOcr = useCallback(
    async (canvas) => {
      setPhase('ocr');
      setHint('Kart okunuyor…');
      try {
        const parsed = await scanCardFromCanvas(canvas);
        if (!parsed.card_number) {
          setError('Kart numarası okunamadı. Işığı artırıp tekrar deneyin.');
          setPhase('scanning');
          setHint('Kartı çerçeveye yerleştirin');
          capturingRef.current = false;
          stableCountRef.current = 0;
          return;
        }
        setPhase('done');
        onScan?.(parsed);
        setTimeout(() => onClose?.(), 600);
      } catch {
        setError('OCR başarısız. Tekrar deneyin.');
        setPhase('scanning');
        capturingRef.current = false;
        stableCountRef.current = 0;
      }
    },
    [onClose, onScan],
  );

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || capturingRef.current) return;
    capturingRef.current = true;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    runOcr(canvas);
  }, [runOcr]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    if (!video || !canvas || video.readyState < 2 || capturingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = ANALYSIS_W;
    canvas.height = ANALYSIS_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, ANALYSIS_W, ANALYSIS_H);

    const analysis = analyzeCardFrame(ctx, ANALYSIS_W, ANALYSIS_H);
    drawCardGuide(ctx, ANALYSIS_W, ANALYSIS_H, { aligned: analysis.aligned });
    setAligned(analysis.aligned);

    if (analysis.aligned) {
      const delta = lastAvgRef.current == null ? 0 : Math.abs(analysis.avg - lastAvgRef.current);
      lastAvgRef.current = analysis.avg;
      if (delta < 10) {
        stableCountRef.current += 1;
      } else {
        stableCountRef.current = Math.max(0, stableCountRef.current - 2);
      }
      if (stableCountRef.current >= STABLE_FRAMES) {
        setHint('Kart algılandı — taranıyor…');
        captureFrame();
      } else {
        setHint('Kartı sabit tutun…');
      }
    } else {
      stableCountRef.current = 0;
      lastAvgRef.current = null;
      setHint('Kartı çerçeveye yerleştirin');
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [captureFrame]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPhase('idle');
      setError('');
      setAligned(false);
      setHint('Kartı çerçeveye yerleştirin');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setPhase('starting');
      setError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase('scanning');
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setError('Kamera açılamadı. Tarayıcı izni verin veya elle girin.');
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera, tick]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-accent-gold" />
          <span className="font-semibold text-sm">Kart Tara</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
        <div className="relative w-full max-w-md aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={analysisCanvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          {(phase === 'ocr' || phase === 'done') && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              {phase === 'done' ? (
                <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-pulse" />
              ) : (
                <Loader2 className="h-12 w-12 text-accent-gold animate-spin" />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3 shrink-0">
        <p
          className={`text-center text-sm font-medium transition-colors ${
            aligned ? 'text-emerald-300' : 'text-amber-200 animate-pulse'
          }`}
        >
          {hint}
        </p>
        {error && (
          <p className="text-center text-xs text-red-300 bg-red-950/50 rounded-xl px-3 py-2">{error}</p>
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            type="button"
            disabled={phase !== 'scanning' || capturingRef.current}
            onClick={captureFrame}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-gold px-4 py-2.5 text-sm font-semibold text-brand-900 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Manuel yakala
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            İptal
          </button>
        </div>
      </div>

      <canvas ref={captureCanvasRef} className="hidden" aria-hidden />
    </div>
  );
}
