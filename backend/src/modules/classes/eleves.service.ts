import { AppDataSource } from "../../data-source";
import { Eleve } from "../../entities/Eleve";
import { Note } from "../../entities/Note";
import { Devoir, BAREME_MAX, COEFFICIENT_PAR_TYPE } from "../../entities/Devoir";
import { obtenirClasse } from "./classes.service";

export interface DonneesEleve {
  nom: string;
  prenom: string;
  matricule?: string;
}

export interface NoteEleveDetail {
  noteId: string | null;
  devoirId: string;
  devoirNom: string;
  type: string;
  date: string;
  baremeMax: number;
  coefficient: number;
  valeur: number | null;
  absent: boolean;
  periodeId: string;
  periodeNom: string;
}

export interface FicheEleve {
  eleve: {
    id: string;
    nom: string;
    prenom: string;
    matricule?: string | null;
  };
  classeId: string;
  notes: NoteEleveDetail[];
  moyenne: number | null;
}

/** Chaîne vide / espaces → undefined (matricule optionnel) */
function normaliserMatricule(
  matricule?: string | null
): string | undefined {
  if (matricule === undefined || matricule === null) return undefined;
  const t = String(matricule).trim();
  return t === "" ? undefined : t;
}

/**
 * Unicité du matricule non vide dans une classe.
 * Plusieurs élèves peuvent avoir matricule null.
 */
async function verifierMatriculeUnique(
  classeId: string,
  matricule: string | undefined,
  eleveIdExclu?: string
): Promise<void> {
  if (!matricule) return;
  const repo = AppDataSource.getRepository(Eleve);
  const existant = await repo.findOne({
    where: { classe: { id: classeId }, matricule },
  });
  if (existant && existant.id !== eleveIdExclu) {
    throw new Error(
      `Le matricule « ${matricule} » est déjà utilisé par un élève de cette classe.`
    );
  }
}

export async function ajouterEleve(
  enseignantId: string,
  classeId: string,
  donnees: DonneesEleve
): Promise<Eleve> {
  const classe = await obtenirClasse(enseignantId, classeId);
  const matricule = normaliserMatricule(donnees.matricule);
  await verifierMatriculeUnique(classeId, matricule);

  const repo = AppDataSource.getRepository(Eleve);
  const eleve = repo.create({
    nom: donnees.nom,
    prenom: donnees.prenom,
    matricule,
    classe,
  });
  return repo.save(eleve);
}

export async function listerEleves(
  enseignantId: string,
  classeId: string
): Promise<Eleve[]> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Eleve);
  return repo.find({
    where: { classe: { id: classeId } },
    order: { nom: "ASC", prenom: "ASC" },
  });
}

export async function obtenirEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string
): Promise<Eleve> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = await repo.findOne({
    where: { id: eleveId, classe: { id: classeId } },
  });
  if (!eleve) {
    throw new Error("Élève introuvable dans cette classe.");
  }
  return eleve;
}

export async function obtenirFicheEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string,
  periodeId?: string
): Promise<FicheEleve> {
  const eleve = await obtenirEleve(enseignantId, classeId, eleveId);

  const devoirRepo = AppDataSource.getRepository(Devoir);
  const noteRepo = AppDataSource.getRepository(Note);

  const whereDevoir: any = { classe: { id: classeId } };
  if (periodeId) {
    whereDevoir.periode = { id: periodeId };
  }

  const devoirs = await devoirRepo.find({
    where: whereDevoir,
    relations: { periode: true },
    order: { date: "ASC" },
  });

  const notesExistantes = await noteRepo.find({
    where: { eleve: { id: eleveId } },
    relations: { devoir: true },
  });
  const noteParDevoir = new Map(
    notesExistantes.map((n) => [n.devoir.id, n])
  );

  const notes: NoteEleveDetail[] = devoirs.map((devoir) => {
    const note = noteParDevoir.get(devoir.id);
    return {
      noteId: note?.id ?? null,
      devoirId: devoir.id,
      devoirNom: devoir.nom,
      type: devoir.type,
      date: devoir.date,
      baremeMax: BAREME_MAX[devoir.type],
      coefficient: COEFFICIENT_PAR_TYPE[devoir.type],
      valeur: note ? Number(note.valeur) : null,
      absent: note?.absent ?? false,
      periodeId: devoir.periode.id,
      periodeNom: devoir.periode.nom,
    };
  });

  const notesPourMoyenne = notes.filter(
    (n) => n.valeur !== null || n.absent
  );
  let moyenne: number | null = null;
  if (notesPourMoyenne.length > 0) {
    let sommeNotes = 0;
    let sommeCoefficients = 0;
    for (const n of notesPourMoyenne) {
      const valeur = n.absent ? 0 : Number(n.valeur);
      sommeNotes += valeur;
      sommeCoefficients += n.coefficient;
    }
    if (sommeCoefficients > 0) {
      moyenne = Math.round((sommeNotes / sommeCoefficients) * 100) / 100;
    }
  }

  return {
    eleve: {
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      matricule: eleve.matricule ?? null,
    },
    classeId,
    notes,
    moyenne,
  };
}

export async function modifierEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string,
  donnees: Partial<DonneesEleve>
): Promise<Eleve> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = await repo.findOne({
    where: { id: eleveId, classe: { id: classeId } },
  });
  if (!eleve) {
    throw new Error("Élève introuvable dans cette classe.");
  }

  if (donnees.nom !== undefined) eleve.nom = donnees.nom;
  if (donnees.prenom !== undefined) eleve.prenom = donnees.prenom;
  if (donnees.matricule !== undefined) {
    const matricule = normaliserMatricule(donnees.matricule);
    await verifierMatriculeUnique(classeId, matricule, eleveId);
    eleve.matricule = matricule;
  }

  return repo.save(eleve);
}

export async function supprimerEleve(
  enseignantId: string,
  classeId: string,
  eleveId: string
): Promise<void> {
  await obtenirClasse(enseignantId, classeId);
  const repo = AppDataSource.getRepository(Eleve);
  const eleve = await repo.findOne({
    where: { id: eleveId, classe: { id: classeId } },
  });
  if (!eleve) {
    throw new Error("Élève introuvable dans cette classe.");
  }
  await repo.remove(eleve);
}
