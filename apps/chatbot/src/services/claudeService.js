// src/services/claudeService.js
// Cliente delgado: habla con la Netlify Function (mismo origen → sin CORS), que
// a su vez llama a Claude con la API key guardada en el servidor. El navegador
// nunca ve la key. Mismo patrón que asrService.js.

export async function sendToClaude({ messages }) {
  const res = await fetch("/api/language_model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error al contactar a Claude.");
  }

  return data.text || "No se pudo obtener respuesta.";
}
