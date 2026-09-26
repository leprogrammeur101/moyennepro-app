import ExcelJS from "exceljs";

export interface LignePreview {
  ligne: number;
  valeurs: Record<string, string>;
}

export interface ResultatDetectionColonnes {
  colonneNom: string | null;
  colonnePrenom: string | null;
  colonneMatricule: string | null;
  apercu: LignePreview[];
  colonnesDisponibles: string[];
}

const MOTS_CLES_NOM = ["nom", "nom eleve", "nom & prenoms", "nom et prenoms"];
const MOTS_CLES_PRENOM = ["prenom", "prenoms", "prenom(s)"];
const MOTS_CLES_MATRICULE = [
  "matricule",
  "mat",
  "n° matricule",
  "no matricule",
  "numero",
  "numéro",
  "id eleve",
  "identifiant",
];

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function chargerPremiereFeuille(
  buffer: Buffer
): Promise<ExcelJS.Worksheet> {
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

export async function detecterColonnes(
  buffer: Buffer
): Promise<ResultatDetectionColonnes> {
  const feuille = await chargerPremiereFeuille(buffer);
  const colonnesDisponibles = extraireEnTetes(feuille);

  const colonneNom =
    colonnesDisponibles.find((col) =>
      MOTS_CLES_NOM.includes(normaliser(col))
    ) ?? null;
  const colonnePrenom =
    colonnesDisponibles.find((col) =>
      MOTS_CLES_PRENOM.includes(normaliser(col))
    ) ?? null;
  const colonneMatricule =
    colonnesDisponibles.find((col) =>
      MOTS_CLES_MATRICULE.includes(normaliser(col))
    ) ?? null;

  const apercu: LignePreview[] = [];
  const derniereLigne = Math.min(feuille.rowCount, 6);
  for (let numeroLigne = 2; numeroLigne <= derniereLigne; numeroLigne++) {
    const row = feuille.getRow(numeroLigne);
    const valeurs: Record<string, string> = {};
    colonnesDisponibles.forEach((col, index) => {
      valeurs[col] = valeurCellule(row.getCell(index + 1));
    });
    apercu.push({ ligne: numeroLigne - 1, valeurs });
  }

  return {
    colonneNom,
    colonnePrenom,
    colonneMatricule,
    apercu,
    colonnesDisponibles,
  };
}

export async function extraireEleves(
  buffer: Buffer,
  colonneNom: string,
  colonnePrenom: string,
  colonneMatricule?: string | null
): Promise<{ nom: string; prenom: string; matricule?: string }[]> {
  const feuille = await chargerPremiereFeuille(buffer);
  const colonnesDisponibles = extraireEnTetes(feuille);

  const indexNom = colonnesDisponibles.indexOf(colonneNom);
  const indexPrenom = colonnesDisponibles.indexOf(colonnePrenom);
  if (indexNom === -1 || indexPrenom === -1) {
    throw new Error("Colonne Nom ou Prénom introuvable dans le fichier.");
  }
  const indexMatricule =
    colonneMatricule && colonneMatricule.trim()
      ? colonnesDisponibles.indexOf(colonneMatricule)
      : -1;

  const eleves: { nom: string; prenom: string; matricule?: string }[] = [];
  feuille.eachRow({ includeEmpty: false }, (row, numeroLigne) => {
    if (numeroLigne === 1) return;
    const nom = valeurCellule(row.getCell(indexNom + 1));
    const prenom = valeurCellule(row.getCell(indexPrenom + 1));
    if (nom === "" && prenom === "") return;

    let matricule: string | undefined;
    if (indexMatricule >= 0) {
      const m = valeurCellule(row.getCell(indexMatricule + 1));
      if (m) matricule = m;
    }
    eleves.push({ nom, prenom, matricule });
  });

  return eleves;
}
