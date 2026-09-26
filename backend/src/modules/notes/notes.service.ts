import { AppDataSource } from "../../data-source";
import { Classe } from "../../entities/Classe";
import { Eleve } from "../../entities/Eleve";
import { Note } from "../../entities/Note";
import { COEFFICIENT_PAR_TYPE } from "../../entities/Devoir";

export interface ResultatEleve {
  eleveId: string;
  nom: string;
  prenom: string;
  matricule?: string | null;
  moyenne: number | null;
  rang: number | null;
}

export interface ResultatClasse {
  classeId: string;
  completude: number;
  resultats: ResultatEleve[];
}

function calculerMoyenne(notes: Note[]): number | null {
  if (notes.length === 0) return null;

  let sommeNotes = 0;
  let sommeCoefficients = 0;

  for (const note of notes) {
    const valeur = note.absent ? 0 : Number(note.valeur);
    const coefficient = COEFFICIENT_PAR_TYPE[note.devoir.type];
    sommeNotes += valeur;
    sommeCoefficients += coefficient;
  }

  if (sommeCoefficients === 0) return null;
  return Math.round((sommeNotes / sommeCoefficients) * 100) / 100;
}

export async function calculerResultatsClasse(
  classeId: string,
  periodeId: string
): Promise<ResultatClasse> {
  const eleveRepo = AppDataSource.getRepository(Eleve);
  const noteRepo = AppDataSource.getRepository(Note);

  const eleves = await eleveRepo.find({ where: { classe: { id: classeId } } });
  const devoirsProgrammes = await AppDataSource.getRepository("Devoir").count({
    where: { classe: { id: classeId }, periode: { id: periodeId } },
  });

  const resultatsBruts = await Promise.all(
    eleves.map(async (eleve) => {
      const notes = await noteRepo.find({
        where: {
          eleve: { id: eleve.id },
          devoir: { classe: { id: classeId }, periode: { id: periodeId } },
        },
        relations: { devoir: true },
      });
      return {
        eleve,
        notes,
        moyenne: calculerMoyenne(notes),
      };
    })
  );

  const eleveComplet = (nbNotes: number) =>
    devoirsProgrammes > 0 && nbNotes >= devoirsProgrammes;
  const nbComplets = resultatsBruts.filter((r) =>
    eleveComplet(r.notes.length)
  ).length;
  const completude =
    eleves.length > 0 ? Math.round((nbComplets / eleves.length) * 100) : 0;

  const classeComplete = completude === 100;

  let resultats: ResultatEleve[];
  if (classeComplete) {
    const trie = [...resultatsBruts].sort(
      (a, b) => (b.moyenne ?? -1) - (a.moyenne ?? -1)
    );
    resultats = trie.map((r, index) => ({
      eleveId: r.eleve.id,
      nom: r.eleve.nom,
      prenom: r.eleve.prenom,
      matricule: r.eleve.matricule ?? null,
      moyenne: r.moyenne,
      rang: r.moyenne !== null ? index + 1 : null,
    }));
  } else {
    resultats = resultatsBruts.map((r) => ({
      eleveId: r.eleve.id,
      nom: r.eleve.nom,
      prenom: r.eleve.prenom,
      matricule: r.eleve.matricule ?? null,
      moyenne: r.moyenne,
      rang: null,
    }));
  }

  return { classeId, completude, resultats };
}
