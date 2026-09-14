// src/services/asrService.js

export async function transcribe({ blob }) {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": blob.type || "audio/webm",
    },
    body: blob,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error al transcribir audio.");
  }

  return {
    lmText: data.lmText || "",
    rawText: data.rawText || "",
  };
}