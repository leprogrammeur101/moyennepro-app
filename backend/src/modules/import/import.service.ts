import { AppDataSource } from "../../data-source";
import { Eleve } from "../../entities/Eleve";
import { Classe } from "../../entities/Classe";
import {
  creerClasse,
  obtenirClasse,
  DonneesClasse,
} from "../classes/classes.service";
import { normaliserMatricule } from "../classes/eleves.service";
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

  const repo = AppDataSource.getRepository(Eleve);
  const existants = await repo.find({ where: { classe: { id: classe.id } } });
  const matriculesExistants = new Set(
    existants.map((e) => e.matricule).filter(Boolean) as string[]
  );
  const vusDansFichier = new Set<string>();

  const elevesNormalises: {
    nom: string;
    prenom: string;
    matricule?: string;
  }[] = [];

  for (let i = 0; i < elevesExtraits.length; i++) {
    const e = elevesExtraits[i];
    let matricule: string | undefined;
    try {
      matricule = normaliserMatricule(e.matricule);
    } catch {
      throw new Error(
        `Ligne ${i + 1} (${e.nom} ${e.prenom}) : matricule invalide « ${e.matricule} ». Format attendu : 8 chiffres + 1 lettre (ex. 12345678A).`
      );
    }

    if (matricule) {
      if (vusDansFichier.has(matricule)) {
        throw new Error(
          `Matricule en double dans le fichier : « ${matricule} ».`
        );
      }
      if (matriculesExistants.has(matricule)) {
        throw new Error(
          `Le matricule « ${matricule} » existe déjà dans cette classe.`
        );
      }
      vusDansFichier.add(matricule);
    }

    elevesNormalises.push({
      nom: e.nom,
      prenom: e.prenom,
      matricule,
    });
  }

  const eleves = elevesNormalises.map((e) =>
    repo.create({
      nom: e.nom,
      prenom: e.prenom,
      matricule: e.matricule,
      classe,
    })
  );
  await repo.save(eleves);

  return { classe, nombreElevesImportes: eleves.length };
}
