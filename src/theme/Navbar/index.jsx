import React from "react";
import Header from "@site/src/components/Header";

// Reemplaza la navbar de Docusaurus por el MISMO Header del demo.
// Mantenemos la clase `.navbar` porque Docusaurus la necesita para medir su
// altura (resaltado del TOC: `document.querySelector('.navbar').clientHeight`).
// La "vaciamos" por CSS (ver custom.css) para que el Header aporte todo el
// estilo; `navbar--fixed-top` conserva el sticky y el Header (w-full) la llena.
export default function Navbar() {
  return (
    <nav className="navbar navbar--fixed-top">
      <Header />
    </nav>
  );
}
