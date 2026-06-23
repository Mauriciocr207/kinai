const BARS = [1, 1.5, 1.9, 1.5, 1];
const DELAYS = [0, 0.1, 0.2, 0.1, 0];

export default function WaveBars({ audioLevel }) {
  return (
    <div className="flex items-center gap-0.5 h-[22px]">
      {BARS.map((mult, n) => (
        <div
          key={n}
          className="w-[3px] rounded-[2px] bg-[#FF6040] transition-[height] duration-[80ms] animate-wbar"
          style={{
            height: `${Math.max(4, audioLevel * 16 * mult)}px`,
            animationDelay: `${DELAYS[n]}s`,
          }}
        />
      ))}
    </div>
  );
}
