import {themes as prismThemes} from 'prism-react-renderer';
import tailwindcss from '@tailwindcss/postcss';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'KINAI · ASR Maya Yucateco',
  tagline: 'Demo y documentación del sistema de reconocimiento de voz para maya yucateco',
  favicon: 'logo_kinai.ico',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // App única servida desde la raíz: '/' = demo (src/pages/index.tsx), '/docs' = documentación.
  url: 'https://maya-asr-chatbot.netlify.app',
  baseUrl: '/',

  organizationName: 'Mauriciocr207',
  projectName: 'maya-asr-chatbot',

  // 'warn' mientras siga el contenido de ejemplo; cambiar a 'throw' con el contenido real.
  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  // Inyecta Tailwind v4 en el pipeline PostCSS de Docusaurus.
  plugins: [
    function tailwindPlugin() {
      return {
        name: 'tailwindcss-v4',
        configurePostCss(postcssOptions) {
          postcssOptions.plugins.push(tailwindcss);
          return postcssOptions;
        },
      };
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Documentación bajo /docs (la raíz '/' la ocupa el demo React).
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/Mauriciocr207/maya-asr-chatbot/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      // Tema oscuro fijo (look del demo): sin toggle claro/oscuro.
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'KINAI · ASR Maya',
      logo: {
        alt: 'KINAI',
        src: 'logo_kinai.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación',
        },
        {
          // href (no "to") => no se le antepone baseUrl: salta a la raíz = demo React.
          href: '/',
          label: '🎤 Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/Mauriciocr207/maya-asr-chatbot',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Proyecto',
          items: [
            {label: 'Demo', href: '/'},
            {
              label: 'GitHub',
              href: 'https://github.com/Mauriciocr207/maya-asr-chatbot',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} KINAI — ASR Maya Yucateco.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
