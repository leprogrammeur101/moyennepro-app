import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../styles/globals.css";
import { ToastProvider } from "../components/Toast";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Échec de l'enregistrement du service worker :", err);
      });
    }
  }, []);

  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}