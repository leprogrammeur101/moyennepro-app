import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A84C" />

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
