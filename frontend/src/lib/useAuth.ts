import { useEffect } from "react";
import { useRouter } from "next/router";
import { deconnecterApi } from "./api";

/**
 * À appeler en tête des pages qui nécessitent une connexion. Redirige
 * vers /login si aucun cache enseignant n'est présent (vérification simple
 * côté client — la vraie protection reste le cookie HttpOnly + middleware backend).
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("enseignant")) {
      router.replace("/login");
    }
  }, [router]);
}

export function estConnecte(): boolean {
  return typeof window !== "undefined" && !!localStorage.getItem("enseignant");
}

export async function deconnecter() {
  await deconnecterApi();
  localStorage.removeItem("enseignant");
  localStorage.removeItem("token"); // legacy
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
