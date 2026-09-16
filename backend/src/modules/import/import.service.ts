import { AppDataSource } from "../../data-source";
import { Eleve } from "../../entities/Eleve";
import { Classe } from "../../entities/Classe";
import { creerClasse, obtenirClasse, DonneesClasse } from "../classes/classes.service";
import { extraireEleves } from "../import/excel-import.service";

export interface ResultatImport {
  classe: Classe;
  nombreElevesImportes: number;
}

export type CibleImport = { classeId: string } | { donneesClasse: DonneesClasse };

/**
 * Étape 2 du flow d'import (voir cahier des charges §2.1 et §4.3) : insère
 * en masse les élèves extraits du fichier Excel, une fois les colonnes
 * Nom/Prénom confirmées (ou mappées manuellement) par l'enseignant.
 *
 * Deux cibles possibles : importer dans une classe déjà existante
 * (obtenirClasse vérifie déjà qu'elle appartient à l'enseignant), ou
 * créer une nouvelle classe à la volée.
 */
export async function importerDepuisExcel(
  enseignantId: string,
  buffer: Buffer,
  colonneNom: string,
  colonnePrenom: string,
  cible: CibleImport
): Promise<ResultatImport> {
  const classe =
    "classeId" in cible
      ? await obtenirClasse(enseignantId, cible.classeId)
      : await creerClasse(enseignantId, cible.donneesClasse);

  const elevesExtraits = await extraireEleves(buffer, colonneNom, colonnePrenom);
  if (elevesExtraits.length === 0) {
    throw new Error("Aucun élève trouvé dans le fichier avec les colonnes sélectionnées.");
  }

  const repo = AppDataSource.getRepository(Eleve);
  const eleves = elevesExtraits.map((e) => repo.create({ ...e, classe }));
  await repo.save(eleves);

  return { classe, nombreElevesImportes: eleves.length };
}
