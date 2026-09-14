export default function TranscribingBubble() {
  return (
    <div className="flex flex-col gap-1 max-w-[88%] animate-fade-up self-end">
      <div className="font-display text-[10.5px] uppercase tracking-[0.12em] opacity-[0.55] px-1">Tú</div>
      <div className="px-[15px] py-[11px] leading-[1.75] text-[15px] whitespace-pre-wrap bg-[rgba(50,80,22,0.32)] border border-[rgba(70,105,32,0.4)] rounded-[12px_12px_3px_12px] text-[#D4E8B0] flex items-center gap-1.5 italic opacity-90">
        <span className="animate-tr-pulse">🎙️</span>
        transcribiendo
        <span>
          <span className="opacity-30 animate-tr-dot">.</span>
          <span className="opacity-30 animate-tr-dot [animation-delay:0.2s]">.</span>
          <span className="opacity-30 animate-tr-dot [animation-delay:0.4s]">.</span>
        </span>
      </div>
    </div>
  );
}
