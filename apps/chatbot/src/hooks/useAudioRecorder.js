import { useRef, useState } from "react";

/* Encapsula la grabación de micrófono + el monitoreo de nivel de audio.
   - onComplete(blob): se llama al detener, con el audio grabado.
   - onError(mensaje): se llama si falla el acceso al micrófono. */
export function useAudioRecorder({ onComplete, onError } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const startMonitor = (stream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setAudioLevel(Math.min(1, avg / 55));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
  };

  const stopMonitor = () => {
    cancelAnimationFrame(animFrameRef.current);
    try {
      audioCtxRef.current?.close();
    } catch {}
    setAudioLevel(0);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startMonitor(stream);
      audioChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) =>
        e.data.size > 0 && audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        stopMonitor();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mime });
        onComplete?.(blob);
      };
      mr.start(100);
      setIsRecording(true);
    } catch (e) {
      onError?.("Sin acceso al micrófono: " + e.message);
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, audioLevel, start, stop };
}
