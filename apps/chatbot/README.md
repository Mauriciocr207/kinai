# Kinai Chatbot

Primera aplicación de KINAI: un chatbot web que conecta captura de voz, ASR maya yucateco y respuestas conversacionales. La aplicación se integró desde [`maya-asr-chatbot`](https://github.com/Mauriciocr207/maya-asr-chatbot); su historial se conserva en la historia de Git del repositorio principal.

## Arquitectura

```
🎙 Micrófono (browser, MediaRecorder)
    ↓
@gradio/client → /predict
    ↓
HuggingFace Space (mau-cr/asr-maya-yucateco)
    ↓ transcripción en maya
Anthropic API (claude-sonnet-4-5)
    ↓ respuesta en maya + español
🖥 Pantalla
```

## Requisitos previos

- Node.js 18+ (recomendado: 20 o más reciente)
- Una API key de Anthropic ([console.anthropic.com](https://console.anthropic.com/))
- Tu Space de HuggingFace activo (el modelo MMS fine-tuneado)

## Instalación

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador (Vite lo abre automáticamente).

## Configuración

Al abrir la app, presiona el botón **⚙** abajo a la derecha:

1. **API de Anthropic** — debe configurarse como `ANTHROPIC_API_KEY` en Netlify; nunca se guarda en el navegador.
2. **Hugging Face** — por defecto: `mau-cr/asr-maya-yucateco`; el token, si es necesario, debe vivir como secreto del servidor.

## Uso

- **Modo texto**: escribe en el cuadro y presiona Enter
- **Modo voz**: presiona 🎙, habla en maya yucateco, presiona de nuevo para detener
- La transcripción se envía automáticamente al chatbot
- Claude responde en maya yucateco + español

## Build para producción

```bash
npm run build
npm run preview   # probar el build localmente
```

Los archivos de producción quedan en `dist/`, listos para subir a cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc.).

## Notas para la demo

- **Los Spaces gratuitos de HuggingFace se duermen** después de ~30 min de inactividad. La primera petición puede tardar 20-60s mientras el Space arranca. Para el día del concurso, abre el Space manualmente unos minutos antes.
- Las funciones de `netlify/functions/` actúan como proxy server-to-server para evitar exponer credenciales.
- El navegador necesita permisos de micrófono. En Chrome funciona en `localhost` y `https://`, en otros orígenes HTTP puede bloquearse.

## Estructura

```
apps/chatbot/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx        # Entry point React
    ├── App.jsx         # Componente principal (todo el chat)
    └── index.css       # Reset CSS
```

## Stack

- **Vite** 5 — bundler
- **React** 18 — UI
- **@gradio/client** 1.x — conexión al Space de HF
- **Fetch nativo** — llamadas a Anthropic
- **Web Audio API + MediaRecorder** — captura de audio

## Alcance

Esta aplicación es un prototipo funcional, no una garantía de que todo el pipeline del asistente final esté completo. Para conocer el estado de ASR, TTS, datos y experimentos consulta la documentación de KINAI en `../../docs/`.
