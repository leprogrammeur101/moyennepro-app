import { Html, Head, Main, NextScript } from "next/document";

const SITE_URL = "https://moyennepro-app.vercel.app";
const SITE_TITLE =
  "MoyennePro — Moyennes et rangs pour enseignants (Côte d'Ivoire)";
const SITE_DESCRIPTION =
  "Saisissez vos notes, importez Excel, obtenez moyennes pondérées et rangs automatiquement. Conçu pour le collège et le lycée en Côte d'Ivoire.";

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="theme-color" content="#C9A84C" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:site_name" content="MoyennePro" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />

        <link rel="canonical" href={SITE_URL} />
        <link rel="manifest" href="/manifest.json" />

        {/* Icônes */}
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link
          rel="icon"
          href="/icons/icon-512.png"
          sizes="512x512"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
