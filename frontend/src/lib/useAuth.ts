import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * À appeler en tête des pages qui nécessitent une connexion. Redirige
 * vers /login si aucun token n'est présent (vérification simple côté
 * client — la vraie protection reste côté backend via exigerAuthentification).
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);
}

export function estConnecte(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem("token");
}

export function deconnecter() {
  localStorage.removeItem("token");
  localStorage.removeItem("enseignant");
}

export interface EnseignantLocal {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  matiere: string | null;
}

export function obtenirEnseignantLocal(): EnseignantLocal | null {
  if (typeof window === "undefined") return null;
  const brut = localStorage.getItem("enseignant");
  return brut ? JSON.parse(brut) : null;
}

/**
 * Met à jour les infos enseignant en cache local (après une modification
 * du profil) sans attendre une reconnexion complète.
 */
export function mettreAJourEnseignantLocal(patch: Partial<EnseignantLocal>) {
  const actuel = obtenirEnseignantLocal();
  if (!actuel) return;
  localStorage.setItem("enseignant", JSON.stringify({ ...actuel, ...patch }));
}
