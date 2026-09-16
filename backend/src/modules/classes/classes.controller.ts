import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
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
export const classesRouter = Router();
classesRouter.use(exigerAuthentification);

// --- Classes ---

classesRouter.post("/classes", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const classe = await creerClasse(req.enseignantId!, req.body);
    res.status(201).json(classe);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

classesRouter.get("/classes", async (req: RequeteAuthentifiee, res: Response) => {
  const classes = await listerClasses(req.enseignantId!);
  res.json(classes);
});

classesRouter.get("/classes/:classeId", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const classe = await obtenirClasse(req.enseignantId!, req.params.classeId);
    res.json(classe);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

classesRouter.put("/classes/:classeId", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const classe = await modifierClasse(req.enseignantId!, req.params.classeId, req.body);
    res.json(classe);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

classesRouter.delete("/classes/:classeId", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    await supprimerClasse(req.enseignantId!, req.params.classeId);
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

// --- Élèves (imbriqués sous une classe) ---

classesRouter.post(
  "/classes/:classeId/eleves",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const eleve = await ajouterEleve(req.enseignantId!, req.params.classeId, req.body);
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
      const eleves = await listerEleves(req.enseignantId!, req.params.classeId);
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
      const eleve = await modifierEleve(
        req.enseignantId!,
        req.params.classeId,
        req.params.eleveId,
        req.body
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
      await supprimerEleve(req.enseignantId!, req.params.classeId, req.params.eleveId);
      res.status(204).send();
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

// Dashboard
classesRouter.get("/dashboard", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const data = await obtenirDashboard(req.enseignantId!);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
});