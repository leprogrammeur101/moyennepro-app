import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Le service worker n'est enregistré qu'en production : en dev, il cache
    // agressivement les pages et sert du code obsolète après chaque changement
    // (c'est exactement ce qui causait le décalage entre Chrome et un navigateur
    // "propre" comme celui de VSCode, qui n'avait jamais enregistré le SW).
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Échec de l'enregistrement du service worker :", err);
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
