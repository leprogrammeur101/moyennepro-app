import { AppDataSource } from "../../data-source";
import { Matiere } from "../../entities/Matiere";

export async function listerMatieres(): Promise<Matiere[]> {
  const repo = AppDataSource.getRepository(Matiere);
  return repo.find({ order: { nom: "ASC" } });
}

/**
 * Retourne la matière existante correspondant à ce nom (comparaison
 * insensible à la casse/espaces) ou la crée si elle n'existe pas encore —
 * utile si un enseignant tape une matière absente de la liste prédéfinie.
 */
export async function obtenirOuCreerMatiere(nom: string): Promise<Matiere> {
  const nomNormalise = nom.trim();
  if (!nomNormalise) {
    throw new Error("Le nom de la matière ne peut pas être vide.");
  }

  const repo = AppDataSource.getRepository(Matiere);
  const existante = await repo
    .createQueryBuilder("matiere")
    .where("LOWER(matiere.nom) = LOWER(:nom)", { nom: nomNormalise })
    .getOne();

  if (existante) return existante;

  return repo.save(repo.create({ nom: nomNormalise }));
}

// Matières courantes du collège/lycée ivoirien — liste de départ pour éviter
// un menu vide au premier lancement. Un enseignant peut toujours en ajouter
// une autre via obtenirOuCreerMatiere si la sienne n'y figure pas.
const MATIERES_PAR_DEFAUT = [
  "Mathématiques",
  "Français",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Histoire-Géographie",
  "Philosophie",
  "Sciences de la Vie et de la Terre",
  "Physique-Chimie",
  "Éducation Physique et Sportive",
  "Économie",
  "EDHC",
];

export async function initialiserMatieresParDefaut(): Promise<void> {
  const repo = AppDataSource.getRepository(Matiere);
  const nombreExistant = await repo.count();
  if (nombreExistant > 0) return; // déjà initialisé, ne rien faire

  await repo.save(MATIERES_PAR_DEFAUT.map((nom) => repo.create({ nom })));
}
