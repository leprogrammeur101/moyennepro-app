import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { creerDevoir, listerDevoirs, supprimerDevoir } from "./devoirs.service";
import { obtenirGrilleSaisie, enregistrerNotes } from "./saisie.service";

export const devoirsRouter = Router();
devoirsRouter.use(exigerAuthentification);

devoirsRouter.post("/classes/:classeId/devoirs", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const devoir = await creerDevoir(req.enseignantId!, req.params.classeId, req.body);
    res.status(201).json(devoir);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

devoirsRouter.get("/classes/:classeId/devoirs", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { periodeId } = req.query;
    const devoirs = await listerDevoirs(
      req.enseignantId!,
      req.params.classeId,
      periodeId as string | undefined
    );
    res.json(devoirs);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

devoirsRouter.delete(
  "/classes/:classeId/devoirs/:devoirId",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      await supprimerDevoir(req.enseignantId!, req.params.classeId, req.params.devoirId);
      res.status(204).send();
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

// Grille de saisie : tous les élèves de la classe + leur note existante pour ce devoir
devoirsRouter.get(
  "/classes/:classeId/devoirs/:devoirId/notes",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const grille = await obtenirGrilleSaisie(
        req.enseignantId!,
        req.params.classeId,
        req.params.devoirId
      );
      res.json(grille);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }
);

// Enregistrement en masse des notes saisies pour ce devoir
devoirsRouter.put(
  "/classes/:classeId/devoirs/:devoirId/notes",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      await enregistrerNotes(
        req.enseignantId!,
        req.params.classeId,
        req.params.devoirId,
        req.body.notes
      );
      res.json({ message: "Notes enregistrées." });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);
