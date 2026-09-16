import { Router, Request, Response } from "express";
import { calculerResultatsClasse } from "./notes.service";
import { exigerAuthentification } from "../auth/auth.middleware";

export const notesRouter = Router();

// GET /api/classes/:classeId/periodes/:periodeId/resultats
notesRouter.get(
  "/classes/:classeId/periodes/:periodeId/resultats",
  exigerAuthentification,
  async (req: Request, res: Response) => {
  try {
    const { classeId, periodeId } = req.params;
    const resultats = await calculerResultatsClasse(classeId, periodeId);
    res.json(resultats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du calcul des résultats" });
  }
  }
);
