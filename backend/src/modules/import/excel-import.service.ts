import ExcelJS from "exceljs";

export interface LignePreview {
  ligne: number;
  valeurs: Record<string, string>;
}

export interface ResultatDetectionColonnes {
  colonneNom: string | null;
  colonnePrenom: string | null;
  apercu: LignePreview[]; // 5 premières lignes, pour confirmation par l'enseignant
  colonnesDisponibles: string[];
}

// Mots-clés utilisés pour la détection automatique (insensible à la casse/accents)
const MOTS_CLES_NOM = ["nom", "nom eleve", "nom & prenoms", "nom et prenoms"];
const MOTS_CLES_PRENOM = ["prenom", "prenoms", "prenom(s)"];

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function chargerPremiereFeuille(buffer: Buffer): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const feuille = workbook.worksheets[0];
  if (!feuille) {
    throw new Error("Le fichier Excel ne contient aucune feuille exploitable.");
  }
  return feuille;
}

function extraireEnTetes(feuille: ExcelJS.Worksheet): string[] {
  const enTetes: string[] = [];
  feuille.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    enTetes[colNumber - 1] = String(cell.value ?? "").trim();
  });
  return enTetes.filter(Boolean);
}

function valeurCellule(cell: ExcelJS.Cell): string {
  const valeur = cell.value;
  if (valeur === null || valeur === undefined) return "";
  if (typeof valeur === "object" && "richText" in (valeur as any)) {
    return (valeur as any).richText.map((r: any) => r.text).join("");
  }
  return String(valeur).trim();
}

/**
 * Étape 1 du flow d'import : détection automatique des colonnes Nom/Prénom
 * + génération d'un aperçu des 5 premières lignes pour confirmation par
 * l'enseignant avant l'import définitif (voir cahier des charges §4.3).
 *
 * Si la détection échoue, colonneNom/colonnePrenom valent null et le
 * frontend doit proposer un mapping manuel de secours.
 */
export async function detecterColonnes(buffer: Buffer): Promise<ResultatDetectionColonnes> {
  const feuille = await chargerPremiereFeuille(buffer);
  const colonnesDisponibles = extraireEnTetes(feuille);

  const colonneNom =
    colonnesDisponibles.find((col) => MOTS_CLES_NOM.includes(normaliser(col))) ?? null;
  const colonnePrenom =
    colonnesDisponibles.find((col) => MOTS_CLES_PRENOM.includes(normaliser(col))) ?? null;

  const apercu: LignePreview[] = [];
  const derniereLigne = Math.min(feuille.rowCount, 6); // en-tête + 5 lignes de données
  for (let numeroLigne = 2; numeroLigne <= derniereLigne; numeroLigne++) {
    const row = feuille.getRow(numeroLigne);
    const valeurs: Record<string, string> = {};
    colonnesDisponibles.forEach((col, index) => {
      valeurs[col] = valeurCellule(row.getCell(index + 1));
    });
    apercu.push({ ligne: numeroLigne - 1, valeurs });
  }

  return { colonneNom, colonnePrenom, apercu, colonnesDisponibles };
}

/**
 * Étape 2 : import définitif une fois les colonnes confirmées (ou
 * mappées manuellement) par l'enseignant.
 */
export async function extraireEleves(
  buffer: Buffer,
  colonneNom: string,
  colonnePrenom: string
): Promise<{ nom: string; prenom: string }[]> {
  const feuille = await chargerPremiereFeuille(buffer);
  const colonnesDisponibles = extraireEnTetes(feuille);

  const indexNom = colonnesDisponibles.indexOf(colonneNom);
  const indexPrenom = colonnesDisponibles.indexOf(colonnePrenom);
  if (indexNom === -1 || indexPrenom === -1) {
    throw new Error("Colonne Nom ou Prénom introuvable dans le fichier.");
  }

  const eleves: { nom: string; prenom: string }[] = [];
  feuille.eachRow({ includeEmpty: false }, (row, numeroLigne) => {
    if (numeroLigne === 1) return; // en-tête
    const nom = valeurCellule(row.getCell(indexNom + 1));
    const prenom = valeurCellule(row.getCell(indexPrenom + 1));
    if (nom !== "" || prenom !== "") {
      eleves.push({ nom, prenom });
    }
  });

  return eleves;
}
