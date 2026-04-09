/**
 * CRIT-004: RON session MediaRecorder hook for capturing audio/video.
 * Stores recording in Supabase storage and returns URL.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseMediaRecorderOptions {
  appointmentId: string;
  userId: string;
}

interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  recordingUrl: string | null;
  uploading: boolean;
}

export function useMediaRecorder({ appointmentId, userId }: UseMediaRecorderOptions) {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    error: null,
    recordingUrl: null,
    uploading: false,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request both screen + audio for RON compliance
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      // Try to get microphone audio as well
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Mic not available — display audio only
      }

      // Combine tracks
      const tracks = [...displayStream.getTracks()];
      if (audioStream) {
        audioStream.getAudioTracks().forEach(t => tracks.push(t));
      }
      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 1_000_000, // 1 Mbps for manageable file sizes
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Stop recording when screen share ends
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorderRef.current?.state === "recording") {
          stopRecording();
        }
      };

      recorder.start(10_000); // 10s chunks
      recorderRef.current = recorder;

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, duration: Math.floor((Date.now() - startTime) / 1000) }));
      }, 1000);

      setState(s => ({ ...s, isRecording: true, isPaused: false, error: null, duration: 0 }));
    } catch (err: any) {
      const message = err?.name === "NotAllowedError"
        ? "Screen sharing was denied. Please allow screen capture to record the RON session."
        : `Recording failed: ${err?.message || "Unknown error"}`;
      setState(s => ({ ...s, error: message }));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<string | null>((resolve) => {
      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setState(s => ({ ...s, isRecording: false, isPaused: false, uploading: true }));

        // Stop all tracks
        streamRef.current?.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const ext = recorder.mimeType.includes("webm") ? "webm" : "mp4";
        const filePath = `ron-recordings/${userId}/${appointmentId}-${Date.now()}.${ext}`;

        try {
          const { error: uploadErr } = await supabase.storage
            .from("documents")
            .upload(filePath, blob, { contentType: recorder.mimeType });

          if (uploadErr) throw uploadErr;

          const { data: urlData } = await supabase.storage
            .from("documents")
            .createSignedUrl(filePath, 10 * 365 * 24 * 3600); // 10-year signed URL for Ohio retention

          const url = urlData?.signedUrl || filePath;
          setState(s => ({ ...s, uploading: false, recordingUrl: url }));
          resolve(url);
        } catch (err: any) {
          setState(s => ({ ...s, uploading: false, error: `Upload failed: ${err?.message}` }));
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, [appointmentId, userId]);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.pause();
      setState(s => ({ ...s, isPaused: true }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current?.state === "paused") {
      recorderRef.current.resume();
      setState(s => ({ ...s, isPaused: false }));
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formattedDuration: formatDuration(state.duration),
  };
}
