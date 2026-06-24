import { renderInline } from "../utils/renderInline";

const BUBBLE_BASE =
  "px-[15px] py-[11px] leading-[1.75] text-[20px] whitespace-pre-wrap [&_strong]:font-semibold [&_em]:italic [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:px-[5px] [&_code]:py-px [&_code]:rounded [&_code]:bg-[rgba(0,0,0,0.3)] [&_code]:border [&_code]:border-[rgba(120,140,70,0.25)] [&_code]:text-[#C9D8A0]";

const BUBBLE_ASSISTANT =
  "bg-[rgba(16,30,14,0.75)] border border-[rgba(90,130,50,0.28)] border-l-[3px] border-l-[rgba(145,105,28,0.55)] rounded-[3px_12px_12px_12px] text-[#E0D4A4] [&_strong]:text-[#E8C45A]";

const BUBBLE_USER =
  "bg-[rgba(50,80,22,0.32)] border border-[rgba(70,105,32,0.4)] rounded-[12px_12px_3px_12px] text-[#D4E8B0] [&_strong]:text-[#EAF6CE]";

export default function Message({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex flex-col gap-1 max-w-[88%] animate-fade-up ${
        isAssistant ? "self-start" : "self-end"
      }`}
    >
      <div className="font-display text-[10.5px] uppercase tracking-[0.12em] opacity-[0.55] px-1">
        {isAssistant ? "KINAI ✦" : "Tú"}
      </div>
      <div className={`${BUBBLE_BASE} ${isAssistant ? BUBBLE_ASSISTANT : BUBBLE_USER}`}>
        {message.fromASR && <span className="mr-1.5 opacity-[0.85]">🎙️</span>}
        <span className="text-[#EAF6CE]">{renderInline(message.content)}</span>
        {message.raw && (
          <div className="mt-2 pt-[7px] border-t border-dashed border-[rgba(70,105,32,0.4)] flex items-baseline gap-[7px] text-[13px] leading-[1.5]">
            <span className="shrink-0 font-display text-[9.5px] uppercase tracking-[0.1em] text-[#5C7038] bg-[rgba(0,0,0,0.28)] border border-[rgba(70,95,40,0.35)] px-1.5 py-0.5 rounded">sin LM</span>
            <span className="text-[#7E8E5E] italic">{message.raw}</span>
          </div>
        )}
      </div>
    </div>
  );
}
