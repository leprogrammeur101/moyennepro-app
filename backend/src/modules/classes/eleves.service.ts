import { AppDataSource } from "../../data-source";
import { Eleve } from "../../entities/Eleve";
import { obtenirClasse } from "./classes.service";

export interface DonneesEleve {
  nom: string;
  prenom: string;
  matricule?: string;
}

/**
 * obtenirClasse() vérifie déjà que la classe appartient bien à
 * l'enseignant connecté — on s'appuie dessus avant toute opération
 * sur les élèves pour éviter qu'un enseignant touche la classe d'un autre.
 */

export async function ajouterEleve(
  enseignantId: string,
  classeId: string,
  donnees: DonneesEleve
): Promise<Eleve> {
  const classe = await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = repo.create({ ...donnees, classe });
  return repo.save(eleve);
}

export async function listerEleves(enseignantId: string, classeId: string): Promise<Eleve[]> {
  const classe = await obtenirClasse(enseignantId, classeId);
  return classe.eleves;
}

export async function modifierEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string,
  donnees: Partial<DonneesEleve>
): Promise<Eleve> {
  await obtenirClasse(enseignantId, classeId); // vérifie l'appartenance de la classe
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = await repo.findOne({ where: { id: eleveId, classe: { id: classeId } } });
  if (!eleve) {
    throw new Error("Élève introuvable dans cette classe.");
  }
  Object.assign(eleve, donnees);
  return repo.save(eleve);
}

export async function supprimerEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string
): Promise<void> {
  await obtenirClasse(enseignantId, classeId); // vérifie l'appartenance de la classe
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = await repo.findOne({ where: { id: eleveId, classe: { id: classeId } } });
  if (!eleve) {
    throw new Error("Élève introuvable dans cette classe.");
  }
  await repo.remove(eleve);
}
