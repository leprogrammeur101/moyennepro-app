import { AppDataSource } from "../../data-source";
import { Devoir, TypeDevoir } from "../../entities/Devoir";
import { obtenirClasse } from "./classes.service";

export interface DonneesDevoir {
  nom: string; // ex: "Interrogation 1", "Devoir 1"
  type: TypeDevoir; // détermine automatiquement le barème et le coefficient
  periodeId: string;
  date: string;
}

/**
 * obtenirClasse() vérifie déjà que la classe appartient bien à
 * l'enseignant connecté — on s'appuie dessus avant toute opération.
 */

export async function creerDevoir(
  enseignantId: string,
  classeId: string,
  donnees: DonneesDevoir
): Promise<Devoir> {
  const classe = await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Devoir);
  const devoir = repo.create({
    nom: donnees.nom,
    type: donnees.type,
    date: donnees.date,
    classe,
    periode: { id: donnees.periodeId } as any,
  });
  return repo.save(devoir);
}

export async function listerDevoirs(
  enseignantId: string,
  classeId: string,
  periodeId?: string
): Promise<Devoir[]> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Devoir);
  return repo.find({
    where: periodeId
      ? { classe: { id: classeId }, periode: { id: periodeId } }
      : { classe: { id: classeId } },
    relations: { periode: true },
    order: { date: "ASC" },
  });
}

export async function obtenirDevoir(
  enseignantId: string,
  classeId: string,
  devoirId: string
): Promise<Devoir> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Devoir);
  const devoir = await repo.findOne({ where: { id: devoirId, classe: { id: classeId } } });
  if (!devoir) {
    throw new Error("Devoir introuvable dans cette classe.");
  }
  return devoir;
}

export async function supprimerDevoir(
  enseignantId: string,
  classeId: string,
  devoirId: string
): Promise<void> {
  const devoir = await obtenirDevoir(enseignantId, classeId, devoirId);
  const repo = AppDataSource.getRepository(Devoir);
  await repo.remove(devoir);
}
