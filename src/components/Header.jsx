export default function Header() {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 bg-[rgba(20,38,24,0.82)] backdrop-blur-md border-b border-[rgba(150,110,34,0.26)] sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="size-10 shrink-0">
          <img src="/logo_kinai.png" alt="logo kinai" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-display text-[18px] text-maya-gold tracking-[0.06em] font-semibold">KINAI — Asistente Maya</div>
          <div className="text-[11px] text-[#5A7A40] tracking-[0.12em] uppercase mt-0.5">ASR · Lengua Yucateca · MMS-1B</div>
        </div>
      </div>
      <div className="font-display text-[11px] px-[11px] py-1 rounded-[20px] bg-[rgba(170,40,25,0.18)] border border-[rgba(210,60,35,0.38)] text-[#E07060] tracking-[0.04em]">SECIHTI 2026</div>
    </div>
  );
}
