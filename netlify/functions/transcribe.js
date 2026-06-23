import { Client } from "@gradio/client";

// El Space corre en ZeroGPU y SOLO es compatible con el SDK de Gradio
// (demo.launch()). El navegador no puede llamarlo directo con un token de HF:
// el header Authorization vuelve la petición "con credenciales" y el CORS de
// hf.space responde "*", que el navegador rechaza con credenciales. Este proxy
// resuelve eso: el navegador habla con esta función (mismo origen → sin CORS) y
// la función llama al Space server-to-server con el token guardado en Netlify.
const SPACE_ID = process.env.HF_SPACE;

// Token server-side, NUNCA en el navegador. Da la cuota de ZeroGPU. Sin él, las
// peticiones son anónimas y caen en la cuota compartida por IP (se agota rápido).
const HF_TOKEN = process.env.HF_TOKEN;
const HAS_TOKEN = !!(HF_TOKEN && HF_TOKEN.startsWith("hf_"));

// El cliente de Gradio se cachea entre invocaciones "calientes" (Netlify reúsa
// el contenedor), evitando reconectar (/config) en cada petición.
let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    const opts = HAS_TOKEN ? { hf_token: HF_TOKEN } : {};
    // Visible en los logs de la función (Netlify → Functions → transcribe).
    console.log(`[transcribe] conectando a ${SPACE_ID} (token: ${HAS_TOKEN ? "sí" : "NO — anónimo"})`);
    clientPromise = Client.connect(SPACE_ID, opts);
  }
  return clientPromise;
}

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido." }, { status: 405 });
  }

  const buf = await req.arrayBuffer();
  if (!buf || buf.byteLength === 0) {
    return Response.json({ error: "No se recibió audio." }, { status: 400 });
  }

  const type = req.headers.get("content-type") || "audio/webm";
  const audio = new Blob([buf], { type });

  try {
    const client = await getClient();
    const result = await client.predict("/transcribir", { audio });

    const out = result.data;
    // data[0] = corregida con modelo de lenguaje, data[1] = cruda (sin LM).
    const lmText = Array.isArray(out)
      ? out[0] ?? ""
      : typeof out === "string"
      ? out
      : "";
    const rawText = Array.isArray(out) ? out[1] ?? "" : "";

    return Response.json({ lmText, rawText });
  } catch (e) {
    // Cliente posiblemente en mal estado (cold start, Space dormido): invalida el
    // cache para reconectar en la próxima petición.
    clientPromise = null;

    const msg = e?.message || String(e);
    const isQuota = /ZeroGPU quota|exceeded.*quota/i.test(msg);
    return Response.json(
      {
        error: isQuota
          ? HAS_TOKEN
            ? "Cuota de ZeroGPU agotada para tu token de HF. Espera unos minutos."
            : "Cuota de ZeroGPU agotada (peticiones ANÓNIMAS): falta definir HF_TOKEN en el entorno donde corre la función (dashboard de Netlify en producción)."
          : `Error ASR: ${msg}`,
      },
      { status: isQuota ? 429 : 502 }
    );
  }
};
