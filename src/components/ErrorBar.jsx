export default function ErrorBar({ error, onClose }) {
  if (!error) return null;
  return (
    <div className="bg-[rgba(140,40,25,0.14)] border border-[rgba(190,65,40,0.3)] text-[#E09070] px-3 py-2 rounded-md text-[13px] flex gap-2 items-start mb-2.5">
      <span>⚠</span>
      <span className="flex-1">{error}</span>
      <button
        className="ml-auto bg-transparent border-none text-[#E09070] cursor-pointer text-[17px] leading-none p-0"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
