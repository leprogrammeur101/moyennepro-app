import { Router, Response } from "express";
import {
  exigerAuthentification,
  RequeteAuthentifiee,
} from "../auth/auth.middleware";
import {
  creerClasse,
  listerClasses,
  obtenirClasse,
  modifierClasse,
  supprimerClasse,
} from "./classes.service";
import {
  ajouterEleve,
  listerEleves,
  modifierEleve,
  supprimerEleve,
} from "./eleves.service";
import { obtenirDashboard } from "./dashboard.service";
import {
  parserOuErreur,
  schemaClasse,
  schemaEleve,
} from "../../lib/validation";

export const classesRouter = Router();
classesRouter.use(exigerAuthentification);

// --- Classes ---

classesRouter.post(
  "/classes",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const donnees = parserOuErreur(schemaClasse, req.body);
      const classe = await creerClasse(req.enseignantId!, donnees);
      res.status(201).json(classe);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({
        message: err.message,
        code: err.code,
      });
    }
  }
);

classesRouter.get(
  "/classes",
  async (req: RequeteAuthentifiee, res: Response) => {
    const classes = await listerClasses(req.enseignantId!);
    res.json(classes);
  }
);

classesRouter.get(
  "/classes/:classeId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const classe = await obtenirClasse(
        req.enseignantId!,
        req.params.classeId
      );
      res.json(classe);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

classesRouter.put(
  "/classes/:classeId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      // Partial : seuls les champs fournis sont validés
      const donnees = parserOuErreur(schemaClasse.partial(), req.body);
      const classe = await modifierClasse(
        req.enseignantId!,
        req.params.classeId,
        donnees
      );
      res.json(classe);
    } catch (err: any) {
      res.status(err.message?.includes("introuvable") ? 404 : 400).json({
        message: err.message,
      });
    }
  }
);

classesRouter.delete(
  "/classes/:classeId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      await supprimerClasse(req.enseignantId!, req.params.classeId);
      res.status(204).send();
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

// --- Élèves (imbriqués sous une classe) ---

classesRouter.post(
  "/classes/:classeId/eleves",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const donnees = parserOuErreur(schemaEleve, req.body);
      const eleve = await ajouterEleve(
        req.enseignantId!,
        req.params.classeId,
        donnees
      );
      res.status(201).json(eleve);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

classesRouter.get(
  "/classes/:classeId/eleves",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const eleves = await listerEleves(
        req.enseignantId!,
        req.params.classeId
      );
      res.json(eleves);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

classesRouter.put(
  "/classes/:classeId/eleves/:eleveId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const donnees = parserOuErreur(schemaEleve.partial(), req.body);
      const eleve = await modifierEleve(
        req.enseignantId!,
        req.params.classeId,
        req.params.eleveId,
        donnees
      );
      res.json(eleve);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

classesRouter.delete(
  "/classes/:classeId/eleves/:eleveId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      await supprimerEleve(
        req.enseignantId!,
        req.params.classeId,
        req.params.eleveId
      );
      res.status(204).send();
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

// Dashboard
classesRouter.get(
  "/dashboard",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const data = await obtenirDashboard(req.enseignantId!);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Erreur serveur" });
    }
  }
);