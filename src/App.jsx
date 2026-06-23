import { useState, useRef, useEffect } from "react";

import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { transcribe } from "./services/asrService";
import { sendToClaude } from "./services/claudeService";

import Header from "./components/Header";
import MessageList from "./components/MessageList";
import InputBar from "./components/InputBar";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Ba'ax ka wa'alik! 🌞 (¡Bienvenido/a!)\n\nSoy KINAI, tu asistente en lengua maya yucateca. Puedo conversar contigo en texto o escuchar tu voz si presionas 🎙.\n\n¿Bix a beel? (¿Cómo te va?)",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessingASR, setIsProcessingASR] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessingChat]);

  /* ── Chatbot Claude ── */
  const sendMessage = async (text, fromASR = false, rawText = "") => {
    if (!text.trim()) return;

    // ¿Hay una transcripción cruda distinta que valga la pena mostrar/enviar?
    const hasRaw = fromASR && rawText.trim() && rawText.trim() !== text.trim();

    const userMsg = fromASR
      ? { role: "user", content: text, fromASR: true, raw: hasRaw ? rawText : "" }
      : { role: "user", content: text };

    const next = [...messages, userMsg];
    setMessages(next);
    setInputText("");
    setIsProcessingChat(true);
    setError("");

    try {
      const reply = await sendToClaude({ messages: next });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Error Claude: " + e.message);
    } finally {
      setIsProcessingChat(false);
    }
  };

  /* ── ASR: transcribe el audio grabado y se lo pasa a Claude ── */
  const runASR = async (blob) => {
    setIsProcessingASR(true);
    setError("");

    // El backend ZeroGPU falla de forma transitoria (cola, cold start). Reintentamos.
    const MAX_INTENTOS = 3;
    let ultimoError = null;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      try {
        const { lmText, rawText } = await transcribe({ blob });

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

        // Cuota de ZeroGPU agotada: reintentar no ayuda. El token de HF vive en
        // el servidor (Netlify), así que el usuario solo puede esperar.
        if (/ZeroGPU quota|exceeded your.*quota/i.test(msg)) {
          setError("Cuota de ZeroGPU agotada. Espera unos minutos e intenta de nuevo.");
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

  const recorder = useAudioRecorder({ onComplete: runASR, onError: setError });

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const statusText = recorder.isRecording
    ? "● Grabando — suelta para transcribir"
    : isProcessingASR
    ? "Procesando audio con MMS-1B…"
    : isProcessingChat
    ? "KINAI está respondiendo…"
    : "MMS-1B fine-tuneado";

  return (
    <div className="min-h-screen flex flex-col bg-maya-bg maya-bg-gradient font-body text-maya-text">
      <Header />

      <MessageList
        messages={messages}
        isProcessingASR={isProcessingASR}
        isProcessingChat={isProcessingChat}
        bottomRef={messagesEndRef}
      />

      <InputBar
        inputText={inputText}
        onInputChange={(e) => setInputText(e.target.value)}
        onSend={() => sendMessage(inputText)}
        onKeyDown={handleKey}
        isRecording={recorder.isRecording}
        isProcessingASR={isProcessingASR}
        isProcessingChat={isProcessingChat}
        audioLevel={recorder.audioLevel}
        onToggleRecord={recorder.isRecording ? recorder.stop : recorder.start}
        statusText={statusText}
        error={error}
        onClearError={() => setError("")}
      />
    </div>
  );
}
