import ErrorBar from "./ErrorBar";
import WaveBars from "./WaveBars";

const BTN_BASE =
  "flex items-center justify-center border-none cursor-pointer rounded-lg transition-all duration-200 outline-none disabled:opacity-[0.35] disabled:cursor-not-allowed";

export default function InputBar({
  inputText,
  onInputChange,
  onSend,
  onKeyDown,
  isRecording,
  isProcessingASR,
  isProcessingChat,
  audioLevel,
  onToggleRecord,
  statusText,
  error,
  onClearError,
}) {
  return (
    <div className="px-4 py-3.5 border-t border-[rgba(90,125,46,0.24)] bg-[rgba(18,34,22,0.9)] max-w-[740px] w-full mx-auto">
      <ErrorBar error={error} onClose={onClearError} />

      <div className="flex gap-2 items-end">
        <button
          className={`${BTN_BASE} w-[58px] h-11 text-maya-gold text-[21px] overflow-hidden relative ${
            isRecording
              ? "bg-[rgba(130,22,14,0.3)] border border-[rgba(210,60,40,0.6)] animate-rec-pulse"
              : "bg-[rgba(22,26,18,0.85)] border border-[rgba(120,90,28,0.38)]"
          }`}
          onClick={onToggleRecord}
          disabled={isProcessingASR || isProcessingChat}
          title={isRecording ? "Detener" : "Grabar en maya"}
        >
          {isRecording ? (
            <WaveBars audioLevel={audioLevel} />
          ) : isProcessingASR ? (
            <span className="text-[19px]">⏳</span>
          ) : (
            "🎙"
          )}
        </button>

        <textarea
          className="flex-1 bg-[rgba(16,28,12,0.8)] border border-[rgba(70,100,38,0.4)] rounded-lg px-3.5 py-2.5 text-maya-text font-body text-[15px] resize-none min-h-[44px] max-h-[120px] outline-none transition-[border-color] duration-200 focus:border-[rgba(145,105,28,0.6)] placeholder:text-[#445534]"
          value={inputText}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Escribe en maya o español… (Enter para enviar)"
          rows={1}
          disabled={isProcessingChat || isRecording}
        />

        <button
          className={`${BTN_BASE} w-11 h-11 bg-[rgba(80,120,32,0.28)] border border-[rgba(100,150,40,0.38)] text-maya-green text-[20px] hover:enabled:bg-[rgba(80,120,32,0.46)]`}
          onClick={onSend}
          disabled={!inputText.trim() || isProcessingChat || isRecording}
          title="Enviar"
        >
          ↑
        </button>
      </div>
      <div className="text-[12px] text-[#4A6840] text-center mt-[7px] italic tracking-[0.05em] min-h-[17px]">{statusText}</div>
    </div>
  );
}
