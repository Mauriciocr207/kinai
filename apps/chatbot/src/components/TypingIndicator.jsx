export default function TypingIndicator() {
  return (
    <div className="flex gap-[5px] items-center px-4 py-3 bg-[rgba(16,30,14,0.75)] border border-[rgba(90,130,50,0.28)] border-l-[3px] border-l-[rgba(145,105,28,0.55)] rounded-[3px_12px_12px_12px] self-start animate-fade-up">
      <div className="w-[7px] h-[7px] rounded-full bg-[#7A9B50] animate-dot" />
      <div className="w-[7px] h-[7px] rounded-full bg-[#7A9B50] animate-dot [animation-delay:0.18s]" />
      <div className="w-[7px] h-[7px] rounded-full bg-[#7A9B50] animate-dot [animation-delay:0.36s]" />
    </div>
  );
}
