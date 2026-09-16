import { Router, Response } from "express";
import multer from "multer";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { detecterColonnes } from "./excel-import.service";
import { importerDepuisExcel, CibleImport } from "./import.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
});

export const importRouter = Router();
importRouter.use(exigerAuthentification);

// Étape 1 : analyse du fichier, détection auto des colonnes + aperçu
importRouter.post(
  "/import/detecter-colonnes",
  upload.single("fichier"),
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier reçu." });
      }
      const resultat = await detecterColonnes(req.file.buffer);
      res.json(resultat);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ message: "Fichier invalide ou illisible." });
    }
  }
);

// Étape 2 : import définitif une fois les colonnes confirmées/mappées
importRouter.post(
  "/import/confirmer",
  upload.single("fichier"),
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier reçu." });
      }
      const { classeId, nom, niveau, annee_scolaire, colonneNom, colonnePrenom } = req.body;
      if (!colonneNom || !colonnePrenom) {
        return res.status(400).json({ message: "Colonnes Nom/Prénom non renseignées." });
      }

      let cible: CibleImport;
      if (classeId) {
        cible = { classeId };
      } else if (nom && niveau && annee_scolaire) {
        cible = { donneesClasse: { nom, niveau, annee_scolaire } };
      } else {
        return res
          .status(400)
          .json({ message: "Choisis une classe existante ou renseigne les infos de la nouvelle classe." });
      }

      const resultat = await importerDepuisExcel(
        req.enseignantId!,
        req.file.buffer,
        colonneNom,
        colonnePrenom,
        cible
      );
      res.status(201).json(resultat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);
