import { AppDataSource } from "../../data-source";
import { Classe } from "../../entities/Classe";
import { verifierLimiteClasses } from "../abonnements/abonnements.service";

export interface DonneesClasse {
  nom: string;
  niveau: string;
  annee_scolaire: string;
}

/**
 * Toutes les fonctions ci-dessous sont scopées à l'enseignant connecté :
 * un enseignant ne peut jamais lire ou modifier la classe d'un autre.
 */

export async function creerClasse(enseignantId: string, donnees: DonneesClasse): Promise<Classe> {
  // Vérifier la limite de classes du plan
  await verifierLimiteClasses(enseignantId);
  const repo = AppDataSource.getRepository(Classe);
  const classe = repo.create({
    ...donnees,
    enseignant: { id: enseignantId } as any,
  });
  return repo.save(classe);
}

export async function listerClasses(enseignantId: string): Promise<Classe[]> {
  const repo = AppDataSource.getRepository(Classe);
  return repo.find({
    where: { enseignant: { id: enseignantId } },
    order: { nom: "ASC" },
  });
}

export async function obtenirClasse(enseignantId: string, classeId: string): Promise<Classe> {
  const repo = AppDataSource.getRepository(Classe);
  const classe = await repo.findOne({
    where: { id: classeId, enseignant: { id: enseignantId } },
    relations: { eleves: true },
  });
  if (!classe) {
    throw new Error("Classe introuvable.");
  }
  return classe;
}

export async function modifierClasse(
  enseignantId: string,
  classeId: string,
  donnees: Partial<DonneesClasse>
): Promise<Classe> {
  const classe = await obtenirClasse(enseignantId, classeId); // vérifie déjà l'appartenance
  const repo = AppDataSource.getRepository(Classe);
  Object.assign(classe, donnees);
  return repo.save(classe);
}

export async function supprimerClasse(enseignantId: string, classeId: string): Promise<void> {
  const classe = await obtenirClasse(enseignantId, classeId); // vérifie déjà l'appartenance
  const repo = AppDataSource.getRepository(Classe);
  await repo.remove(classe);
}
