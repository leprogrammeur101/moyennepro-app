import { Router, Response } from "express";
import multer from "multer";
import {
  exigerAuthentification,
  RequeteAuthentifiee,
} from "../auth/auth.middleware";
import { detecterColonnes } from "./excel-import.service";
import { importerDepuisExcel, CibleImport } from "./import.service";

const MIMES_AUTORISES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/csv",
]);

const EXTENSIONS_AUTORISEES = /\.(xlsx|xls|csv)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const mimeOk = MIMES_AUTORISES.has(file.mimetype);
    const extOk = EXTENSIONS_AUTORISEES.test(file.originalname);
    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Format de fichier non supporté. Utilise un fichier Excel (.xlsx, .xls) ou CSV."
        )
      );
    }
  },
});

export const importRouter = Router();
importRouter.use(exigerAuthentification);

// Middleware pour transformer les erreurs multer en JSON propre
function gererErreurUpload(
  err: any,
  _req: RequeteAuthentifiee,
  res: Response,
  next: Function
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Fichier trop volumineux (max 5 Mo)." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

// Étape 1 : analyse du fichier, détection auto des colonnes + aperçu
importRouter.post(
  "/import/detecter-colonnes",
  (req, res, next) => {
    upload.single("fichier")(req, res, (err) =>
      gererErreurUpload(err, req as RequeteAuthentifiee, res, next)
    );
  },
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
  (req, res, next) => {
    upload.single("fichier")(req, res, (err) =>
      gererErreurUpload(err, req as RequeteAuthentifiee, res, next)
    );
  },
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier reçu." });
      }
      const {
        classeId,
        nom,
        niveau,
        annee_scolaire,
        colonneNom,
        colonnePrenom,
      } = req.body;

      if (!colonneNom || !colonnePrenom) {
        return res
          .status(400)
          .json({ message: "Colonnes Nom/Prénom non renseignées." });
      }

      let cible: CibleImport;
      if (classeId) {
        cible = { classeId };
      } else if (nom && niveau && annee_scolaire) {
        cible = { donneesClasse: { nom, niveau, annee_scolaire } };
      } else {
        return res.status(400).json({
          message:
            "Choisis une classe existante ou renseigne les infos de la nouvelle classe.",
        });
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