import { useLocation } from "@docusaurus/router";

const GITHUB_URL = "https://github.com/Mauriciocr207/maya-asr-chatbot";

// Header compartido por el demo (/) y la documentación (/docs).
// - En el demo lo monta App.jsx.
// - En la doc lo monta src/theme/Navbar (reemplaza la navbar de Docusaurus).
// `rightSlot` es un hueco opcional (p.ej. el buscador) que solo la doc llenará.
export default function Header({ rightSlot }) {
  const { pathname } = useLocation();

  const NAV_ITEMS = [
    { label: "Demo", href: "/", active: pathname === "/" },
    { label: "Docs", href: "/docs", active: pathname.startsWith("/docs") },
    { label: "GitHub", href: GITHUB_URL, external: true },
  ];

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-y-2 px-5 py-3.5 bg-[rgba(20,38,24,0.82)] backdrop-blur-md border-b border-[rgba(150,110,34,0.26)] sticky top-0 z-[200]">
      <div className="flex items-center gap-3">
        <div className="size-10 shrink-0">
          <img src="/logo_kinai.png" alt="logo kinai" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-display text-[18px] text-maya-gold tracking-[0.06em] font-semibold">KINAI — Asistente Maya</div>
          <div className="text-[11px] text-[#5A7A40] tracking-[0.12em] uppercase mt-0.5">ASR · Lengua Yucateca · MMS-1B</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Hueco para el buscador: solo lo pasa la doc; el demo lo deja vacío. */}
        {rightSlot}
        <nav className="flex items-center gap-1.5 flex-wrap">
          {NAV_ITEMS.map(({ label, href, active, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              aria-current={active ? "page" : undefined}
              className={`font-display no-underline hover:no-underline text-[12px] tracking-[0.08em] uppercase px-3.5 py-1.5 rounded-[20px] border transition-colors ${
                active
                  ? "bg-[rgba(170,140,40,0.18)] border-[rgba(212,176,72,0.45)] text-maya-gold"
                  : "border-transparent text-[#9FAE83] hover:text-maya-gold hover:bg-[rgba(150,110,34,0.12)] hover:border-[rgba(150,110,34,0.30)]"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
