# K'in — Chatbot ASR Maya Yucateco

Demo para el concurso **SECIHTI 2025**. Pipeline completo de reconocimiento de voz en maya yucateco con respuestas conversacionales generadas por Claude.

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

1. **API Key de Anthropic** — se guarda en `localStorage` del navegador
2. **HuggingFace Space** — por defecto: `mau-cr/asr-maya-yucateco`

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
- **API Key expuesta**: esta versión es solo para demo. Para producción real, monta un backend que proxee las llamadas a Anthropic.
- El navegador necesita permisos de micrófono. En Chrome funciona en `localhost` y `https://`, en otros orígenes HTTP puede bloquearse.

## Estructura

```
maya-asr-chatbot/
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
