import { useState, useRef, useEffect } from "react";
import { Client } from "@gradio/client";

const { VITE_ANTHROPIC_API_KEY, VITE_HF_SPACE, VITE_HF_TOKEN } = import.meta.env

/* ──────────────────────────────────────────────
   CONFIGURACIÓN
────────────────────────────────────────────── */
const CLAUDE_MODEL = "claude-sonnet-4-5";

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

/* ──────────────────────────────────────────────
   MINI-MARKDOWN INLINE  → React (sin dependencias)
   Soporta negrita, italica (con asterisco o guion bajo) y codigo.
   Construye elementos (no innerHTML), así que es seguro.
   El salto de línea lo conserva el CSS white-space: pre-wrap.
────────────────────────────────────────────── */
function renderInline(text) {
  if (typeof text !== "string" || !text) return text;

  const regex =
    /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`/gs;
  const nodes = [];
  let last = 0;
  let i = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));

    if (m[1] != null || m[2] != null) {
      nodes.push(<strong key={i}>{m[1] ?? m[2]}</strong>);
    } else if (m[3] != null || m[4] != null) {
      nodes.push(<em key={i}>{m[3] ?? m[4]}</em>);
    } else if (m[5] != null) {
      nodes.push(
        <code key={i} className="md-code">
          {m[5]}
        </code>
      );
    }

    last = regex.lastIndex;
    i++;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ──────────────────────────────────────────────
   COMPONENTE PRINCIPAL
────────────────────────────────────────────── */
export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ba'ax ka wa'alik! 🌞 (¡Bienvenido/a!)\n\nSoy KINAI, tu asistente en lengua maya yucateca. Puedo conversar contigo en texto o escuchar tu voz si presionas 🎙.\n\n¿Bix a beel? (¿Cómo te va?)",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingASR, setIsProcessingASR] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Persistente entre sesiones
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("anthropic_key") || VITE_ANTHROPIC_API_KEY
  );
  const [spaceId, setSpaceId] = useState(
    () => localStorage.getItem("space_id") || VITE_HF_SPACE
  );
  // Token de HF: necesario para la cuota de ZeroGPU (sin él, peticiones anónimas
  // se quedan sin cuota y el Space devuelve 500).
  const [hfToken, setHfToken] = useState(
    () => localStorage.getItem("hf_token") || VITE_HF_TOKEN || ""
  );

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const gradioClientRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessingChat]);

  /* ── Audio monitoring ── */
  const startMonitor = (stream) => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      analyserRef.current = an;
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

  /* ── Grabación ── */
  const startRecording = async () => {
    setError("");
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
        runASR(blob);
      };
      mr.start(100);
      setIsRecording(true);
    } catch (e) {
      setError("Sin acceso al micrófono: " + e.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /* ── Conexión al Space (con token de HF si está disponible) ── */
  const connectGradio = async () => {
    if (gradioClientRef.current) return gradioClientRef.current;
    const opts = {};
    if (hfToken && hfToken.startsWith("hf_")) opts.hf_token = hfToken;
    gradioClientRef.current = await Client.connect(spaceId, opts);
    return gradioClientRef.current;
  };

  /* ── ASR via @gradio/client ── */
  const runASR = async (blob) => {
    setIsProcessingASR(true);
    setError("");

    // El backend ZeroGPU falla de forma transitoria (cola, cold start). Reintentamos.
    const MAX_INTENTOS = 3;
    let ultimoError = null;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      try {
        const client = await connectGradio();
        const result = await client.predict("/transcribir", { audio: blob });

        const out = result.data;
        // data[0] = corregida con LM, data[1] = cruda (sin LM).
        const lmText = Array.isArray(out)
          ? out[0] ?? ""
          : typeof out === "string"
          ? out
          : "";
        const rawText = Array.isArray(out) ? out[1] ?? "" : "";

        // Texto principal: prioriza la corregida, cae a la cruda si falta.
        const text = lmText.trim() ? lmText : rawText;

        // Transcripción lista: apagar el estado ASR ANTES de invocar a Claude,
        // si no, "Transcribiendo…" y "KINAI pensando…" se muestran a la vez.
        setIsProcessingASR(false);

        if (text.trim()) {
          await sendMessage(text, true, rawText);
        } else {
          setError("No se detectó voz. Intenta hablar más cerca del micrófono.");
        }
        return; // éxito
      } catch (e) {
        ultimoError = e;
        const msg = e?.message || String(e);
        gradioClientRef.current = null; // reconectar en el próximo intento

        // Cuota de ZeroGPU agotada: reintentar no ayuda, hace falta token.
        if (/ZeroGPU quota|exceeded your.*quota/i.test(msg)) {
          setError(
            hfToken
              ? "Cuota de ZeroGPU agotada para tu token de HF. Espera unos minutos o usa una cuenta PRO."
              : "Cuota de ZeroGPU agotada (peticiones anónimas). Agrega tu token de Hugging Face en ⚙ Ajustes para obtener cuota."
          );
          setShowSettings(!hfToken);
          setIsProcessingASR(false);
          return;
        }

        // Error transitorio: esperar con backoff y reintentar.
        if (intento < MAX_INTENTOS) {
          setError(`El modelo está despertando… reintentando (${intento}/${MAX_INTENTOS})`);
          await new Promise((r) => setTimeout(r, 1500 * intento));
        }
      }
    }

    setError("Error ASR: " + (ultimoError?.message || String(ultimoError)));
    setIsProcessingASR(false);
  };

  /* ── Chatbot Claude ── */
  const sendMessage = async (text, fromASR = false, rawText = "") => {
    if (!text.trim()) return;
    if (!apiKey) {
      setError("Configura tu API key de Anthropic en ⚙ Ajustes.");
      setShowSettings(true);
      return;
    }

    // ¿Hay una transcripción cruda distinta que valga la pena mostrar/enviar?
    const hasRaw =
      fromASR && rawText.trim() && rawText.trim() !== text.trim();

    const userMsg = fromASR
      ? { role: "user", content: text, fromASR: true, raw: hasRaw ? rawText : "" }
      : { role: "user", content: text };

    const next = [...messages, userMsg];
    setMessages(next);
    setInputText("");
    setIsProcessingChat(true);
    setError("");

    try {
      const apiMsgs = next.map((m) => {
        // Mensaje de voz con ambas calidades → dárselas como contexto a Claude
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

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMsgs,
        }),
      });

      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error?.message || `HTTP ${r.status}`);
      }
      const reply = d.content?.[0]?.text || "No se pudo obtener respuesta.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Error Claude: " + e.message);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const saveSettings = () => {
    localStorage.setItem("anthropic_key", apiKey);
    localStorage.setItem("space_id", spaceId);
    localStorage.setItem("hf_token", hfToken);
    gradioClientRef.current = null; // forzar reconexión si cambió el Space o el token
    setShowSettings(false);
  };

  const statusText = isRecording
    ? "● Grabando — suelta para transcribir"
    : isProcessingASR
    ? "Procesando audio con MMS-1B…"
    : isProcessingChat
    ? "KINAI está respondiendo…"
    : `MMS-1B fine-tuneado · ${spaceId}`;

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #091409;
          background-image:
            radial-gradient(ellipse 60% 50% at 15% 40%, rgba(34,68,18,.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 85% 20%, rgba(90,55,10,.12) 0%, transparent 60%);
          font-family: 'Crimson Pro', Georgia, serif;
          color: #DDD0A0;
        }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: rgba(6,14,6,.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(140,100,30,.22);
          position: sticky; top: 0; z-index: 20;
        }
        .hd-left { display: flex; align-items: center; gap: 12px; }
        .hd-icon { font-size: 26px; line-height: 1; }
        .hd-title {
          font-family: 'Cinzel', serif; font-size: 18px;
          color: #C9A53A; letter-spacing: .06em; font-weight: 600;
        }
        .hd-sub {
          font-size: 11px; color: #5A7A40; letter-spacing: .12em;
          text-transform: uppercase; margin-top: 2px;
        }
        .badge {
          font-family: 'Cinzel', serif; font-size: 11px;
          padding: 4px 11px; border-radius: 20px;
          background: rgba(170,40,25,.18);
          border: 1px solid rgba(210,60,35,.38);
          color: #E07060; letter-spacing: .04em;
        }

        .msgs {
          flex: 1; overflow-y: auto; padding: 24px 16px;
          display: flex; flex-direction: column; gap: 16px;
          max-width: 740px; width: 100%; margin: 0 auto;
        }

        .msg { display: flex; flex-direction: column; gap: 4px; max-width: 88%; animation: fadeUp .28s ease; }
        .msg.user { align-self: flex-end; }
        .msg.assistant { align-self: flex-start; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .msg-lbl {
          font-family: 'Cinzel', serif; font-size: 10.5px;
          text-transform: uppercase; letter-spacing: .12em;
          opacity: .55; padding: 0 4px;
        }
        .msg-bubble {
          padding: 11px 15px; line-height: 1.75; font-size: 15px;
          white-space: pre-wrap; border-radius: 4px;
        }
        .msg.user .msg-bubble {
          background: rgba(50,80,22,.32);
          border: 1px solid rgba(70,105,32,.4);
          border-radius: 12px 12px 3px 12px;
          color: #D4E8B0;
        }
        .mic-tag { margin-right: 6px; opacity: .85; }
        .msg-main { color: #EAF6CE; }

        .msg-bubble strong { font-weight: 600; }
        .msg.assistant .msg-bubble strong { color: #E8C45A; }
        .msg.user .msg-bubble strong { color: #EAF6CE; }
        .msg-bubble em { font-style: italic; }
        .md-code {
          font-family: 'SFMono-Regular', Consolas, monospace;
          font-size: .9em; padding: 1px 5px; border-radius: 4px;
          background: rgba(0,0,0,.3);
          border: 1px solid rgba(120,140,70,.25);
          color: #C9D8A0;
        }
        .raw-line {
          margin-top: 8px; padding-top: 7px;
          border-top: 1px dashed rgba(70,105,32,.4);
          display: flex; align-items: baseline; gap: 7px;
          font-size: 13px; line-height: 1.5;
        }
        .raw-lbl {
          flex-shrink: 0;
          font-family: 'Cinzel', serif; font-size: 9.5px;
          text-transform: uppercase; letter-spacing: .1em;
          color: #5C7038; background: rgba(0,0,0,.28);
          border: 1px solid rgba(70,95,40,.35);
          padding: 2px 6px; border-radius: 4px;
        }
        .raw-text { color: #7E8E5E; font-style: italic; }
        .msg.assistant .msg-bubble {
          background: rgba(16,30,14,.75);
          border: 1px solid rgba(90,130,50,.28);
          border-left: 3px solid rgba(145,105,28,.55);
          border-radius: 3px 12px 12px 12px;
          color: #E0D4A4;
        }

        .typing {
          display: flex; gap: 5px; align-items: center;
          padding: 12px 16px;
          background: rgba(16,30,14,.75);
          border: 1px solid rgba(90,130,50,.28);
          border-left: 3px solid rgba(145,105,28,.55);
          border-radius: 3px 12px 12px 12px;
          align-self: flex-start; animation: fadeUp .28s ease;
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #7A9B50; animation: bounce 1.1s infinite;
        }
        .dot:nth-child(2) { animation-delay: .18s; }
        .dot:nth-child(3) { animation-delay: .36s; }
        @keyframes bounce {
          0%,60%,100% { transform: translateY(0); opacity: .35; }
          30%          { transform: translateY(-7px); opacity: 1; }
        }

        .msg-bubble.transcribing {
          display: flex; align-items: center; gap: 6px;
          font-style: italic; opacity: .9;
        }
        .tr-mic { animation: trPulse 1.2s ease-in-out infinite; }
        @keyframes trPulse {
          0%,100% { opacity: .4; transform: scale(.92); }
          50%      { opacity: 1;  transform: scale(1.08); }
        }
        .tr-dots span {
          opacity: .3; animation: trDot 1.1s infinite;
        }
        .tr-dots span:nth-child(1) { animation-delay: 0s; }
        .tr-dots span:nth-child(2) { animation-delay: .2s; }
        .tr-dots span:nth-child(3) { animation-delay: .4s; }
        @keyframes trDot {
          0%,60%,100% { opacity: .3; }
          30%          { opacity: 1; }
        }

        .input-area {
          padding: 14px 16px;
          border-top: 1px solid rgba(80,110,40,.2);
          background: rgba(5,12,5,.92);
          max-width: 740px; width: 100%; margin: 0 auto;
        }
        .error-bar {
          background: rgba(140,40,25,.14);
          border: 1px solid rgba(190,65,40,.3);
          color: #E09070; padding: 8px 12px;
          border-radius: 6px; font-size: 13px;
          display: flex; gap: 8px; align-items: flex-start;
          margin-bottom: 10px;
        }
        .err-close {
          margin-left: auto; background: none; border: none;
          color: #E09070; cursor: pointer; font-size: 17px; line-height: 1; padding: 0;
        }
        .input-row { display: flex; gap: 8px; align-items: flex-end; }
        .txt {
          flex: 1; background: rgba(16,28,12,.8);
          border: 1px solid rgba(70,100,38,.4);
          border-radius: 8px; padding: 10px 14px;
          color: #DDD0A0; font-family: 'Crimson Pro', serif; font-size: 15px;
          resize: none; min-height: 44px; max-height: 120px; outline: none;
          transition: border-color .2s;
        }
        .txt:focus { border-color: rgba(145,105,28,.6); }
        .txt::placeholder { color: #445534; }

        .btn {
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; border-radius: 8px;
          transition: all .2s; outline: none;
        }
        .btn:disabled { opacity: .35; cursor: not-allowed; }

        .btn-send {
          width: 44px; height: 44px;
          background: rgba(80,120,32,.28);
          border: 1px solid rgba(100,150,40,.38);
          color: #90C060; font-size: 20px;
        }
        .btn-send:hover:not(:disabled) { background: rgba(80,120,32,.46); }

        .btn-mic {
          width: 58px; height: 44px;
          background: rgba(22,26,18,.85);
          border: 1px solid rgba(120,90,28,.38);
          color: #C9A53A; font-size: 21px;
          overflow: hidden; position: relative;
        }
        .btn-mic.rec {
          background: rgba(130,22,14,.3);
          border-color: rgba(210,60,40,.6);
          animation: recPulse 1.4s infinite;
        }
        @keyframes recPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(210,60,40,.4); }
          50%      { box-shadow: 0 0 0 7px rgba(210,60,40,0); }
        }

        .wavebars { display: flex; align-items: center; gap: 2px; height: 22px; }
        .wbar {
          width: 3px; border-radius: 2px; background: #FF6040;
          transition: height .08s ease;
          animation: wbAnim .45s infinite alternate;
        }
        .wbar:nth-child(1) { animation-delay: 0s; }
        .wbar:nth-child(2) { animation-delay: .1s; }
        .wbar:nth-child(3) { animation-delay: .2s; }
        .wbar:nth-child(4) { animation-delay: .1s; }
        .wbar:nth-child(5) { animation-delay: 0s; }
        @keyframes wbAnim {
          from { transform: scaleY(.3); }
          to   { transform: scaleY(1.2); }
        }

        .btn-cfg {
          width: 44px; height: 44px;
          background: transparent;
          border: 1px solid rgba(70,95,45,.28);
          color: #567045; font-size: 17px;
        }
        .btn-cfg:hover { color: #C9A53A; border-color: rgba(145,105,28,.4); }

        .status {
          font-size: 12px; color: #4A6840; text-align: center;
          margin-top: 7px; font-style: italic;
          letter-spacing: .05em; min-height: 17px;
        }

        .overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal {
          background: #0E1C0E;
          border: 1px solid rgba(90,130,45,.3);
          border-radius: 12px; padding: 24px;
          width: 100%; max-width: 490px;
          max-height: 88vh; overflow-y: auto;
        }
        .modal-title {
          font-family: 'Cinzel', serif; color: #C9A53A;
          font-size: 15px; letter-spacing: .05em;
          margin-bottom: 20px;
        }
        .fld { margin-bottom: 15px; }
        .fld label {
          display: block; font-size: 11.5px; text-transform: uppercase;
          letter-spacing: .1em; color: #5A7A40; margin-bottom: 5px;
          font-family: 'Cinzel', serif;
        }
        .fld input {
          width: 100%; background: rgba(16,28,12,.85);
          border: 1px solid rgba(70,100,38,.4);
          border-radius: 6px; padding: 8px 11px;
          color: #DDD0A0; font-family: 'Crimson Pro', serif;
          font-size: 14px; outline: none;
        }
        .fld input:focus { border-color: rgba(145,105,28,.6); }
        .hint { font-size: 11.5px; color: #4A6438; margin-top: 5px; line-height: 1.5; }
        .hint a { color: #8AAA60; text-decoration: none; }
        .hint a:hover { text-decoration: underline; }
        .sep { border: none; border-top: 1px solid rgba(70,95,45,.2); margin: 15px 0; }
        .btn-save {
          width: 100%; padding: 10px;
          background: rgba(80,120,32,.22);
          border: 1px solid rgba(100,150,40,.38);
          color: #90C060; border-radius: 8px; cursor: pointer;
          font-family: 'Cinzel', serif; font-size: 13px;
          letter-spacing: .05em; margin-top: 16px;
          transition: all .2s;
        }
        .btn-save:hover { background: rgba(80,120,32,.38); }

        .msgs::-webkit-scrollbar { width: 4px; }
        .msgs::-webkit-scrollbar-track { background: transparent; }
        .msgs::-webkit-scrollbar-thumb { background: rgba(100,120,60,.3); border-radius: 4px; }
      `}</style>

      <div className="app">
        <div className="header">
          <div className="hd-left">
            <div className="hd-icon">🌞</div>
            <div>
              <div className="hd-title">KINAI — Asistente Maya</div>
              <div className="hd-sub">ASR · Lengua Yucateca · MMS-1B</div>
            </div>
          </div>
          <div className="badge">SECIHTI 2026</div>
        </div>

        <div className="msgs">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="msg-lbl">
                {m.role === "assistant" ? "KINAI ✦" : "Tú"}
              </div>
              <div className="msg-bubble">
                {m.fromASR && <span className="mic-tag">🎙️</span>}
                <span className="msg-main">{renderInline(m.content)}</span>
                {m.raw && (
                  <div className="raw-line">
                    <span className="raw-lbl">sin LM</span>
                    <span className="raw-text">{m.raw}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isProcessingASR && (
            <div className="msg user">
              <div className="msg-lbl">Tú</div>
              <div className="msg-bubble transcribing">
                <span className="tr-mic">🎙️</span>
                transcribiendo
                <span className="tr-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}
          {isProcessingChat && (
            <div className="typing">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {error && (
            <div className="error-bar">
              <span>⚠</span>
              <span style={{ flex: 1 }}>{error}</span>
              <button className="err-close" onClick={() => setError("")}>×</button>
            </div>
          )}
          <div className="input-row">
            <button
              className={`btn btn-mic ${isRecording ? "rec" : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessingASR || isProcessingChat}
              title={isRecording ? "Detener" : "Grabar en maya"}
            >
              {isRecording ? (
                <div className="wavebars">
                  {[1, 1.5, 1.9, 1.5, 1].map((m, n) => (
                    <div
                      key={n}
                      className="wbar"
                      style={{ height: `${Math.max(4, audioLevel * 16 * m)}px` }}
                    />
                  ))}
                </div>
              ) : isProcessingASR ? (
                <span style={{ fontSize: "19px" }}>⏳</span>
              ) : (
                "🎙"
              )}
            </button>

            <textarea
              className="txt"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe en maya o español… (Enter para enviar)"
              rows={1}
              disabled={isProcessingChat || isRecording}
            />

            <button
              className="btn btn-send"
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isProcessingChat || isRecording}
              title="Enviar"
            >
              ↑
            </button>

            <button
              className="btn btn-cfg"
              onClick={() => setShowSettings(true)}
              title="Configuración"
            >
              ⚙
            </button>
          </div>
          <div className="status">{statusText}</div>
        </div>

        {showSettings && (
          <div className="overlay" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">⚙ Configuración</div>

              <div className="fld">
                <label>API Key de Anthropic</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <div className="hint">
                  Se guarda en tu navegador (localStorage). Para obtener una:{" "}
                  <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">
                    console.anthropic.com
                  </a>
                </div>
              </div>

              <hr className="sep" />

              <div className="fld">
                <label>HuggingFace Space (ASR)</label>
                <input
                  type="text"
                  value={spaceId}
                  onChange={(e) => setSpaceId(e.target.value)}
                />
                <div className="hint">
                  Formato: <code>usuario/nombre-del-space</code>. Por defecto usa tu
                  modelo fine-tuneado para maya yucateco.
                </div>
              </div>

              <div className="fld">
                <label>Token de Hugging Face (ZeroGPU)</label>
                <input
                  type="password"
                  placeholder="hf_..."
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                />
                <div className="hint">
                  El Space corre en <strong>ZeroGPU</strong>: sin token las peticiones
                  son anónimas y se quedan sin cuota (error 500). Crea uno de tipo
                  <em> read</em> en{" "}
                  <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">
                    huggingface.co/settings/tokens
                  </a>
                  . Se guarda solo en tu navegador.
                </div>
              </div>

              <hr className="sep" />

              <div className="hint" style={{ lineHeight: 1.6 }}>
                <strong style={{ color: "#8AAA60" }}>Arquitectura del demo:</strong><br />
                Micrófono → WebM → @gradio/client → /predict (HF Space) →
                transcripción → Claude API → respuesta.
              </div>

              <button className="btn-save" onClick={saveSettings}>
                Guardar y cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
