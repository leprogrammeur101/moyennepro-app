import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  // Envoie le cookie HttpOnly (moyennepro_token) sur chaque requête cross-origin
  withCredentials: true,
});

// Si la session cookie est absente, invalide ou expirée, le backend répond 401 —
// on déconnecte proprement et on redirige vers /login au lieu de laisser
// chaque page planter sur une erreur non gérée.
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur?.response?.status === 401 && typeof window !== "undefined") {
      const pagesPubliques = ["/", "/login", "/inscription"];
      const estPagePublique = pagesPubliques.includes(window.location.pathname);

      localStorage.removeItem("enseignant");
      // Nettoyage legacy (anciennes sessions avec token en localStorage)
      localStorage.removeItem("token");

      if (!estPagePublique) {
        window.location.href = "/login";
      }
      return new Promise(() => {});
    }
    return Promise.reject(erreur);
  }
);

export interface SessionAuth {
  enseignant: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    matiere: string | null;
  };
}

export interface Profil {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  matiere: string | null;
}

export async function obtenirProfil(): Promise<Profil> {
  const { data } = await api.get("/enseignant/profil");
  return data;
}

export async function definirMatiere(nom: string): Promise<{ matiere: string | null }> {
  const { data } = await api.put("/enseignant/matiere", { nom });
  return data;
}

export async function mettreAJourProfil(donnees: {
  nom?: string;
  prenom?: string;
  matiere?: string;
}): Promise<Profil> {
  const { data } = await api.put("/enseignant/profil", donnees);
  return data;
}

export async function listerMatieres(): Promise<string[]> {
  const { data } = await api.get("/matieres");
  return data.map((m: { nom: string }) => m.nom);
}

export async function inscrire(
  nom: string,
  prenom: string,
  email: string,
  mot_de_passe: string,
  matiere: string
): Promise<SessionAuth> {
  const { data } = await api.post("/auth/register", {
    nom,
    prenom,
    email,
    mot_de_passe,
    matiere,
  });
  return data;
}

export async function connecter(
  email: string,
  mot_de_passe: string
): Promise<SessionAuth> {
  const { data } = await api.post("/auth/login", { email, mot_de_passe });
  return data;
}

export async function connecterAvecGoogle(
  credential: string
): Promise<SessionAuth> {
  const { data } = await api.post("/auth/google", { credential });
  return data;
}

/** Déconnexion côté serveur (efface le cookie HttpOnly) + nettoyage local */
export async function deconnecterApi(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // Ignorer : on nettoie quand même le cache local
  }
}

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  annee_scolaire: string;
}

export interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
}

export async function listerClasses(): Promise<Classe[]> {
  const { data } = await api.get("/classes");
  return data;
}

export async function creerClasse(donnees: Omit<Classe, "id">): Promise<Classe> {
  const { data } = await api.post("/classes", donnees);
  return data;
}

export async function supprimerClasse(classeId: string): Promise<void> {
  await api.delete(`/classes/${classeId}`);
}

export async function listerEleves(classeId: string): Promise<Eleve[]> {
  const { data } = await api.get(`/classes/${classeId}/eleves`);
  return data;
}

export async function ajouterEleve(
  classeId: string,
  donnees: Omit<Eleve, "id">
): Promise<Eleve> {
  const { data } = await api.post(`/classes/${classeId}/eleves`, donnees);
  return data;
}

export async function supprimerEleve(
  classeId: string,
  eleveId: string
): Promise<void> {
  await api.delete(`/classes/${classeId}/eleves/${eleveId}`);
}

export type TypeDevoir = "INTERROGATION" | "DEVOIR";

export interface Periode {
  id: string;
  nom: string;
  annee_scolaire: string;
  date_debut: string;
  date_fin: string;
}

export interface Devoir {
  id: string;
  nom: string;
  type: TypeDevoir;
  date: string;
  periode: Periode;
}

export interface LigneSaisie {
  eleveId: string;
  nom: string;
  prenom: string;
  valeur: number | null;
  absent: boolean;
}

export interface GrilleSaisie {
  devoir: { id: string; nom: string; type: TypeDevoir; baremeMax: number };
  lignes: LigneSaisie[];
}

export async function listerPeriodes(): Promise<Periode[]> {
  const { data } = await api.get("/periodes");
  return data;
}

export async function creerPeriode(
  donnees: Omit<Periode, "id">
): Promise<Periode> {
  const { data } = await api.post("/periodes", donnees);
  return data;
}

export async function listerDevoirs(classeId: string): Promise<Devoir[]> {
  const { data } = await api.get(`/classes/${classeId}/devoirs`);
  return data;
}

export async function creerDevoir(
  classeId: string,
  donnees: { nom: string; type: TypeDevoir; periodeId: string; date: string }
): Promise<Devoir> {
  const { data } = await api.post(`/classes/${classeId}/devoirs`, donnees);
  return data;
}

export async function supprimerDevoir(
  classeId: string,
  devoirId: string
): Promise<void> {
  await api.delete(`/classes/${classeId}/devoirs/${devoirId}`);
}

export async function obtenirGrilleSaisie(
  classeId: string,
  devoirId: string
): Promise<GrilleSaisie> {
  const { data } = await api.get(
    `/classes/${classeId}/devoirs/${devoirId}/notes`
  );
  return data;
}

export async function enregistrerNotes(
  classeId: string,
  devoirId: string,
  notes: { eleveId: string; valeur: number; absent: boolean }[]
): Promise<void> {
  await api.put(`/classes/${classeId}/devoirs/${devoirId}/notes`, { notes });
}

export interface ApercuColonnes {
  colonneNom: string | null;
  colonnePrenom: string | null;
  colonnesDisponibles: string[];
  apercu: { ligne: number; valeurs: Record<string, string> }[];
}

export interface DonneesNouvelleClasse {
  nom: string;
  niveau: string;
  annee_scolaire: string;
}

export async function detecterColonnesExcel(
  fichier: File
): Promise<ApercuColonnes> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  const { data } = await api.post("/import/detecter-colonnes", formData);
  return data;
}

export type CibleImport =
  | { classeId: string }
  | { donneesClasse: DonneesNouvelleClasse };

export async function confirmerImportExcel(
  fichier: File,
  colonneNom: string,
  colonnePrenom: string,
  cible: CibleImport
): Promise<{ classe: Classe; nombreElevesImportes: number }> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  formData.append("colonneNom", colonneNom);
  formData.append("colonnePrenom", colonnePrenom);
  if ("classeId" in cible) {
    formData.append("classeId", cible.classeId);
  } else {
    formData.append("nom", cible.donneesClasse.nom);
    formData.append("niveau", cible.donneesClasse.niveau);
    formData.append("annee_scolaire", cible.donneesClasse.annee_scolaire);
  }
  const { data } = await api.post("/import/confirmer", formData);
  return data;
}

export async function telechargerPdfResultats(
  classeId: string,
  periodeId: string
): Promise<Blob> {
  const { data } = await api.get(
    `/classes/${classeId}/periodes/${periodeId}/export-pdf`,
    { responseType: "blob" }
  );
  return data;
}

export type PlanAbonnement = "GRATUIT" | "TRIMESTRIEL" | "ANNUEL";
export type StatutAbonnement = "EN_ATTENTE" | "ACTIF" | "EXPIRE" | "ANNULE";

export interface Abonnement {
  id?: string;
  plan: PlanAbonnement;
  statut: StatutAbonnement;
  date_debut: string;
  date_fin?: string;
}

export interface PlanTarif {
  plan: PlanAbonnement;
  prix: number;
}

export async function obtenirAbonnementActif(): Promise<Abonnement> {
  const { data } = await api.get("/abonnements/actif");
  return data;
}

export async function listerPlansTarifs(): Promise<PlanTarif[]> {
  const { data } = await api.get("/abonnements/plans");
  return data;
}

export async function souscrireAbonnement(
  plan: PlanAbonnement
): Promise<{ paymentUrl: string }> {
  const { data } = await api.post("/abonnements/souscrire", { plan });
  return data;
}

/** Stocke uniquement les infos enseignant (pas le JWT — il est en cookie HttpOnly) */
export function enregistrerSession(session: SessionAuth) {
  localStorage.setItem("enseignant", JSON.stringify(session.enseignant));
  // Nettoyage legacy
  localStorage.removeItem("token");
}

export interface ResultatEleve {
  eleveId: string;
  nom: string;
  prenom: string;
  moyenne: number | null;
  rang: number | null;
}

export interface ResultatClasse {
  classeId: string;
  completude: number;
  resultats: ResultatEleve[];
}

export async function getResultatsClasse(
  classeId: string,
  periodeId: string
): Promise<ResultatClasse> {
  const { data } = await api.get(
    `/classes/${classeId}/periodes/${periodeId}/resultats`
  );
  return data;
}

export interface DashboardData {
  resume: {
    nombreClasses: number;
    nombreEleves: number;
    periodeEnCours: string;
  };
  saisiesEnAttente: {
    id: string;
    nomDevoir: string;
    classeNom: string;
    classeId: string;
    notesSaisies: number;
    totalEleves: number;
  }[];
  classes: {
    id: string;
    nom: string;
    niveau: string;
    anneeScolaire: string;
    nombreEleves: number;
    completude: number;
  }[];
}

export async function obtenirDashboard(): Promise<DashboardData> {
  const { data } = await api.get("/dashboard");
  return data;
}
