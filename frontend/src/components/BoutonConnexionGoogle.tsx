import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  onCredential: (credential: string) => void;
}

/**
 * Bouton "Se connecter avec Google" en un clic, basé sur Google Identity
 * Services (chargé dynamiquement, pas de dépendance npm supplémentaire).
 * Le credential renvoyé est un ID token JWT à vérifier côté backend
 * (voir auth.service.ts -> connecterAvecGoogle).
 */
export default function BoutonConnexionGoogle({ onCredential }: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID manquant — bouton Google désactivé.");
      return;
    }

    function initialiser() {
      if (!window.google || !conteneurRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (reponse: { credential: string }) => onCredential(reponse.credential),
      });
      window.google.accounts.id.renderButton(conteneurRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale: "fr",
        width: 320,
      });
    }

    if (window.google) {
      initialiser();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initialiser;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onCredential]);

  return <div ref={conteneurRef} />;
}
