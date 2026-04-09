/**
 * CRIT-004/007: RON session recording panel with MediaRecorder integration.
 * Provides screen capture + audio recording for Ohio ORC §147.66 compliance.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Square, Pause, Play, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";

interface Props {
  appointmentId: string;
  userId: string;
  onRecordingUrl: (url: string) => void;
  disabled?: boolean;
}

export function RonRecordingPanel({ appointmentId, userId, onRecordingUrl, disabled }: Props) {
  const {
    isRecording, isPaused, formattedDuration, error,
    recordingUrl, uploading,
    startRecording, stopRecording, pauseRecording, resumeRecording,
  } = useMediaRecorder({ appointmentId, userId });

  const handleStop = async () => {
    const url = await stopRecording();
    if (url) onRecordingUrl(url);
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Session Recording</span>
          </div>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse text-xs">
              ● REC {formattedDuration}
            </Badge>
          )}
          {recordingUrl && !isRecording && (
            <Badge className="bg-primary/10 text-primary text-xs">
              <CheckCircle className="mr-1 h-3 w-3" /> Saved
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Ohio ORC §147.66 requires audio-video recording of all RON sessions with 10-year retention.
        </p>

        {error && (
          <div className="rounded bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading recording to secure storage...
          </div>
        )}

        <div className="flex gap-2">
          {!isRecording && !recordingUrl && (
            <Button size="sm" onClick={startRecording} disabled={disabled || uploading}>
              <Video className="mr-1.5 h-3.5 w-3.5" /> Start Recording
            </Button>
          )}
          {isRecording && !isPaused && (
            <>
              <Button size="sm" variant="outline" onClick={pauseRecording}>
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Stop & Save
              </Button>
            </>
          )}
          {isRecording && isPaused && (
            <>
              <Button size="sm" onClick={resumeRecording}>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
              </Button>
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Stop & Save
              </Button>
            </>
          )}
          {recordingUrl && !isRecording && (
            <Button size="sm" variant="outline" onClick={startRecording} disabled={disabled || uploading}>
              <Video className="mr-1.5 h-3.5 w-3.5" /> Record Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
