import type { AppProps } from "next/app";
import { useEffect } from "react";
import "../styles/globals.css";
import { ToastProvider, useToast } from "../components/Toast";

function NetworkToasts() {
  const { showToast } = useToast();

  useEffect(() => {
    function handleOffline() {
      showToast("Connexion perdue — les notes seront synchronisées plus tard", "error");
    }

    function handleOnline() {
      showToast("Connexion rétablie", "success");
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [showToast]);

  return null;
}

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
      <NetworkToasts />
      <Component {...pageProps} />
    </ToastProvider>
  );
}