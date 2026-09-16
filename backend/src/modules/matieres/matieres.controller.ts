import { Router, Response, Request } from "express";
import { listerMatieres } from "./matieres.service";

export const matieresRouter = Router();

// Public : nécessaire pour peupler le sélecteur de matière à l'inscription,
// avant même qu'un compte (et donc un token) existe.
matieresRouter.get("/matieres", async (_req: Request, res: Response) => {
  const matieres = await listerMatieres();
  res.json(matieres);
});
