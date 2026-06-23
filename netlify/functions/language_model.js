// Proxy server-to-server hacia la API de Anthropic. La API key de Claude vive
// SOLO en las variables de entorno de Netlify (ANTHROPIC_API_KEY), nunca en el
// navegador: el navegador habla con esta función (mismo origen → sin CORS) y la
// función llama a Claude con la key guardada en el servidor. Mismo patrón que
// transcribe.js con el token de HF.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 1000;

const SYSTEM_PROMPT = `Eres KINAI (derivado de K'in, sol en maya yucateco y AI), un asistente conversacional especializado en la lengua y cultura maya yucateca. Formas parte de un sistema de demostración de reconocimiento automático de voz (ASR) para lenguas originarias, presentado en el concurso SECIHTI.

Tu forma de responder:
1. Comienza SIEMPRE con una frase corta en maya yucateco seguida de su traducción entre paréntesis
2. Responde al contenido del mensaje de manera útil y culturalmente informada
3. Incluye vocabulario maya relevante de forma natural
4. Si el mensaje viene de una transcripción de audio (marcado con 🎙️), trátalo como conversación normal
5. Sé cálido, accesible y pedagógico
6. Si no estás seguro de una palabra maya específica, indícalo con honestidad

Ejemplo de formato:
"Ba'ax ka wa'alik? (¿Cómo estás?)
[respuesta en español con contexto cultural o palabras mayas relevantes]"`;

/* Convierte el historial local al formato de la API. Los mensajes de voz con
   ambas calidades (con/sin LM) se fusionan en un solo mensaje de contexto. */
function toApiMessages(messages) {
  return messages.map((m) => {
    if (m.role === "user" && m.fromASR && m.raw) {
      return {
        role: "user",
        content:
          "[Mensaje transcrito de audio en maya yucateco. Es UNA misma frase con dos versiones de distinta calidad de transcripción.]\n\n" +
          `Transcripción con modelo de lenguaje (más confiable): ${m.content}\n` +
          `Transcripción cruda sin modelo de lenguaje: ${m.raw}\n\n` +
          "Responde a la intención del mensaje; usa la versión cruda solo para desambiguar si la corregida fuera confusa.",
      };
    }
    return { role: m.role, content: m.content };
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido." }, { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Falta ANTHROPIC_API_KEY en las variables de entorno del servidor." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No se recibieron mensajes." }, { status: 400 });
  }

  try {
    // Llamada server-to-server: x-api-key + anthropic-version. NO se usa
    // `anthropic-dangerous-direct-browser-access` (eso es solo para el navegador).
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: toApiMessages(messages),
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return Response.json(
        { error: data.error?.message || `HTTP ${r.status}` },
        { status: r.status }
      );
    }

    const text = data.content?.[0]?.text || "No se pudo obtener respuesta.";
    return Response.json({ text });
  } catch (e) {
    return Response.json(
      { error: `Error Claude: ${e?.message || String(e)}` },
      { status: 502 }
    );
  }
};
