import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, XCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onCapture: (base64: string) => void;
  onSkip: () => void;
}

type Feedback = {
  message: string;
  type: "warning" | "success" | "info";
};

export default function IDScanAssistant({ onCapture, onSkip }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({ message: "Position your ID within the frame", type: "info" });
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const frameCountRef = useRef(0);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch {
      setFeedback({ message: "Camera access denied. Please allow camera access or use manual upload.", type: "warning" });
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate average brightness
    let totalBrightness = 0;
    const sampleStep = 20; // Sample every 20th pixel for performance
    let samples = 0;
    for (let i = 0; i < data.length; i += 4 * sampleStep) {
      totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      samples++;
    }
    const avgBrightness = totalBrightness / samples;

    // Check for glare (very bright spots)
    let glarePixels = 0;
    for (let i = 0; i < data.length; i += 4 * sampleStep) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) glarePixels++;
    }
    const glareRatio = glarePixels / samples;

    // Check for contrast (edge detection approximation)
    let edgeCount = 0;
    const w = canvas.width;
    for (let y = 10; y < canvas.height - 10; y += 10) {
      for (let x = 10; x < w - 10; x += 10) {
        const idx = (y * w + x) * 4;
        const idxR = (y * w + x + 5) * 4;
        const diff = Math.abs(data[idx] - data[idxR]) + Math.abs(data[idx + 1] - data[idxR + 1]);
        if (diff > 40) edgeCount++;
      }
    }

    frameCountRef.current++;

    if (avgBrightness < 60) {
      setFeedback({ message: "Too dark — find better lighting", type: "warning" });
      setReady(false);
    } else if (avgBrightness > 220) {
      setFeedback({ message: "Too bright — move away from direct light", type: "warning" });
      setReady(false);
    } else if (glareRatio > 0.15) {
      setFeedback({ message: "Glare detected — tilt your ID slightly", type: "warning" });
      setReady(false);
    } else if (edgeCount < 50) {
      setFeedback({ message: "Move closer — ID is too far away", type: "warning" });
      setReady(false);
    } else {
      setFeedback({ message: "Perfect! Hold still and capture", type: "success" });
      setReady(true);
    }
  }, [stream]);

  useEffect(() => {
    if (!stream) return;
    const interval = setInterval(analyzeFrame, 500);
    return () => clearInterval(interval);
  }, [stream, analyzeFrame]);

  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCapturing(true);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1];
    stopCamera();
    onCapture(base64);
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {!stream ? (
          <div className="p-8 text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI ID Scan Assistant</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get real-time feedback on lighting and positioning before scanning your ID
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={startCamera}>
                <Camera className="mr-2 h-4 w-4" /> Open Camera
              </Button>
              <Button variant="outline" onClick={onSkip}>
                Skip — Upload Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full aspect-video object-cover"
            />
            {/* ID frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-[75%] h-[55%] rounded-lg border-2 border-dashed transition-colors duration-300",
                  ready ? "border-primary" : "border-amber-400"
                )}
              />
            </div>

            {/* Feedback bar */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-2 text-sm font-medium",
                feedback.type === "success" && "bg-primary/90 text-primary-foreground",
                feedback.type === "warning" && "bg-amber-500/90 text-primary-foreground",
                feedback.type === "info" && "bg-background/90 text-foreground backdrop-blur"
              )}
            >
              {feedback.type === "success" && <CheckCircle className="h-4 w-4" />}
              {feedback.type === "warning" && <AlertTriangle className="h-4 w-4" />}
              {feedback.message}
            </div>

            {/* Controls */}
            <div className="p-4 flex gap-2 justify-center bg-background">
              <Button
                onClick={capturePhoto}
                disabled={!ready || capturing}
                size="lg"
              >
                {capturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                Capture ID
              </Button>
              <Button variant="outline" onClick={() => { stopCamera(); onSkip(); }}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
