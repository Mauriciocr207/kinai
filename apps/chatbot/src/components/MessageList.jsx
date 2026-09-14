import Message from "./Message";
import TranscribingBubble from "./TranscribingBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({ messages, isProcessingASR, isProcessingChat, bottomRef }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 max-w-[740px] w-full mx-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(100,120,60,0.3)] [&::-webkit-scrollbar-thumb]:rounded">
      {messages.map((m, i) => (
        <Message key={i} message={m} />
      ))}
      {isProcessingASR && <TranscribingBubble />}
      {isProcessingChat && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
