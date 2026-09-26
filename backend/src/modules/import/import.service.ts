import { AppDataSource } from "../../data-source";
import { Eleve } from "../../entities/Eleve";
import { Classe } from "../../entities/Classe";
import {
  creerClasse,
  obtenirClasse,
  DonneesClasse,
} from "../classes/classes.service";
import { extraireEleves } from "../import/excel-import.service";
import { verifierLimiteClasses } from "../abonnements/abonnements.service";

export interface ResultatImport {
  classe: Classe;
  nombreElevesImportes: number;
}

export type CibleImport =
  | { classeId: string }
  | { donneesClasse: DonneesClasse };

export async function importerDepuisExcel(
  enseignantId: string,
  buffer: Buffer,
  colonneNom: string,
  colonnePrenom: string,
  cible: CibleImport,
  colonneMatricule?: string | null
): Promise<ResultatImport> {
  if (!("classeId" in cible)) {
    await verifierLimiteClasses(enseignantId);
  }

  const classe =
    "classeId" in cible
      ? await obtenirClasse(enseignantId, cible.classeId)
      : await creerClasse(enseignantId, cible.donneesClasse);

  const elevesExtraits = await extraireEleves(
    buffer,
    colonneNom,
    colonnePrenom,
    colonneMatricule
  );
  if (elevesExtraits.length === 0) {
    throw new Error(
      "Aucun élève trouvé dans le fichier avec les colonnes sélectionnées."
    );
  }

  // Unicité des matricules dans le fichier + dans la classe existante
  const repo = AppDataSource.getRepository(Eleve);
  const existants = await repo.find({ where: { classe: { id: classe.id } } });
  const matriculesExistants = new Set(
    existants.map((e) => e.matricule).filter(Boolean) as string[]
  );
  const vusDansFichier = new Set<string>();

  for (const e of elevesExtraits) {
    const m = e.matricule?.trim();
    if (!m) continue;
    if (vusDansFichier.has(m)) {
      throw new Error(
        `Matricule en double dans le fichier : « ${m} ».`
      );
    }
    if (matriculesExistants.has(m)) {
      throw new Error(
        `Le matricule « ${m} » existe déjà dans cette classe.`
      );
    }
    vusDansFichier.add(m);
  }

  const eleves = elevesExtraits.map((e) =>
    repo.create({
      nom: e.nom,
      prenom: e.prenom,
      matricule: e.matricule?.trim() || undefined,
      classe,
    })
  );
  await repo.save(eleves);

  return { classe, nombreElevesImportes: eleves.length };
}
