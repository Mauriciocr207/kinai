import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';

// La home es el demo React a pantalla completa: NO usamos <Layout>, así no hay
// navbar/footer de Docusaurus (el demo trae su propio Header). El demo usa APIs
// del navegador (MediaRecorder, etc.), por eso va dentro de <BrowserOnly> y solo
// se monta en cliente — evita problemas de SSR.
export default function Home(): React.ReactElement {
  return (
    <>
      <Head>
        <html lang="es" />
        <title>KINAI — Asistente Maya · ASR Demo</title>
        <meta
          name="description"
          content="Demo de reconocimiento de voz (ASR) para lengua maya yucateca."
        />
      </Head>
      <BrowserOnly
        fallback={<div style={{minHeight: '100vh', background: '#16291b'}} />}
      >
        {() => {
          const App = require('@site/src/App.jsx').default;
          return <App />;
        }}
      </BrowserOnly>
    </>
  );
}
