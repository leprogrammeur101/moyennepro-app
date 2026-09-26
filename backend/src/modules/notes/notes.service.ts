import { AppDataSource } from "../../data-source";
import { Classe } from "../../entities/Classe";
import { Eleve } from "../../entities/Eleve";
import { Note } from "../../entities/Note";
import { COEFFICIENT_PAR_TYPE } from "../../entities/Devoir";

export interface ResultatEleve {
  eleveId: string;
  nom: string;
  prenom: string;
  moyenne: number | null; // null si aucune note saisie
  rang: number | null; // null si la classe n'est pas complète
}

export interface ResultatClasse {
  classeId: string;
  completude: number; // % d'élèves ayant au moins une note dans chaque devoir programmé
  resultats: ResultatEleve[];
}

/**
 * Calcule la moyenne d'un élève à partir de ses notes.
 *
 * Formule (validée avec Soro) :
 *   moyenne = somme(notes) / somme(coefficients)
 *
 * - On n'applique PAS note × coefficient au numérateur.
 * - Les coefficients interviennent uniquement au dénominateur.
 * - Une note absente vaut 0 ; son coefficient reste inclus.
 * - Interrogations (/10, coeff 0,5) et devoirs (/20, coeff 1) sont
 *   additionnés en valeurs brutes, sans conversion d'échelle.
 */
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

/**
 * Calcule la moyenne et le rang de tous les élèves d'une classe,
 * dans la matière de l'enseignant, pour une période donnée.
 *
 * Le rang est calculé "à la volée" (pas de table de classement figé) :
 * il est recalculé à chaque appel à partir des notes actuelles.
 */
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

  // Complétude : proportion d'élèves ayant une note pour chaque devoir programmé
  const eleveComplet = (nbNotes: number) =>
    devoirsProgrammes > 0 && nbNotes >= devoirsProgrammes;
  const nbComplets = resultatsBruts.filter((r) =>
    eleveComplet(r.notes.length)
  ).length;
  const completude =
    eleves.length > 0 ? Math.round((nbComplets / eleves.length) * 100) : 0;

  // Le rang n'est publié que si la classe est à 100% de complétude
  // (évite un classement faussé par des notes manquantes) — voir cahier des charges §2.3
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
      moyenne: r.moyenne,
      rang: r.moyenne !== null ? index + 1 : null,
    }));
  } else {
    resultats = resultatsBruts.map((r) => ({
      eleveId: r.eleve.id,
      nom: r.eleve.nom,
      prenom: r.eleve.prenom,
      moyenne: r.moyenne,
      rang: null, // classe incomplète : pas de rang affiché
    }));
  }

  return { classeId, completude, resultats };
}
