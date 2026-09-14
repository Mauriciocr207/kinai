/* ──────────────────────────────────────────────
   MINI-MARKDOWN INLINE  → React (sin dependencias)
   Soporta negrita, italica (con asterisco o guion bajo) y codigo.
   Construye elementos (no innerHTML), así que es seguro.
   El salto de línea lo conserva el CSS white-space: pre-wrap.
   El estilo de <strong>/<em>/<code> lo aplica la burbuja contenedora
   (variantes descendientes de Tailwind).
────────────────────────────────────────────── */
export function renderInline(text) {
  if (typeof text !== "string" || !text) return text;

  const regex =
    /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|`(.+?)`/gs;
  const nodes = [];
  let last = 0;
  let i = 0;
  let m;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));

    if (m[1] != null || m[2] != null) {
      nodes.push(<strong key={i}>{m[1] ?? m[2]}</strong>);
    } else if (m[3] != null || m[4] != null) {
      nodes.push(<em key={i}>{m[3] ?? m[4]}</em>);
    } else if (m[5] != null) {
      nodes.push(<code key={i}>{m[5]}</code>);
    }

    last = regex.lastIndex;
    i++;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
