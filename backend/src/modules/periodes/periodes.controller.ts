import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { creerPeriode, listerPeriodes } from "./periodes.service";
import { parserOuErreur, schemaPeriode } from "../../lib/validation";

export const periodesRouter = Router();
periodesRouter.use(exigerAuthentification);

periodesRouter.post("/periodes", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const donnees = parserOuErreur(schemaPeriode, req.body);
    const periode = await creerPeriode(donnees);
    res.status(201).json(periode);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

periodesRouter.get("/periodes", async (req: RequeteAuthentifiee, res: Response) => {
  const { annee_scolaire } = req.query;
  const periodes = await listerPeriodes(annee_scolaire as string | undefined);
  res.json(periodes);
});
