import { AppDataSource } from "../../data-source";
import { Enseignant } from "../../entities/Enseignant";
import { obtenirOuCreerMatiere } from "../matieres/matieres.service";

export async function obtenirProfil(enseignantId: string): Promise<Enseignant> {
  const repo = AppDataSource.getRepository(Enseignant);
  const enseignant = await repo.findOne({ where: { id: enseignantId } }); // matiere chargée en eager
  if (!enseignant) {
    throw new Error("Enseignant introuvable.");
  }
  return enseignant;
}

/**
 * Rattache (ou change) la matière de l'enseignant. Un enseignant n'a
 * qu'une seule matière à la fois (système ivoirien — voir cahier des
 * charges). Utile en particulier pour les comptes créés via Google, qui
 * n'ont jamais eu l'occasion de la renseigner à l'inscription.
 */
export async function definirMatiere(enseignantId: string, nomMatiere: string): Promise<Enseignant> {
  const matiere = await obtenirOuCreerMatiere(nomMatiere);

  const repo = AppDataSource.getRepository(Enseignant);
  const enseignant = await repo.findOne({ where: { id: enseignantId } });
  if (!enseignant) {
    throw new Error("Enseignant introuvable.");
  }

  enseignant.matiere = matiere;
  await repo.save(enseignant);
  return enseignant;
}

export interface DonneesProfil {
  nom?: string;
  prenom?: string;
  matiere?: string;
}

/**
 * Met à jour le profil en une fois (nom, prénom, matière) — utilisé par
 * la page /profil pour un enregistrement en un seul appel.
 */
export async function mettreAJourProfil(
  enseignantId: string,
  donnees: DonneesProfil
): Promise<Enseignant> {
  const repo = AppDataSource.getRepository(Enseignant);
  const enseignant = await repo.findOne({ where: { id: enseignantId } });
  if (!enseignant) {
    throw new Error("Enseignant introuvable.");
  }

  if (donnees.nom) enseignant.nom = donnees.nom;
  if (donnees.prenom) enseignant.prenom = donnees.prenom;
  if (donnees.matiere) enseignant.matiere = await obtenirOuCreerMatiere(donnees.matiere);

  await repo.save(enseignant);
  return enseignant;
}
