import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { obtenirProfil, definirMatiere, mettreAJourProfil } from "./enseignant.service";
import {
  parserOuErreur,
  schemaMatiere,
  schemaProfil,
} from "../../lib/validation";

export const enseignantRouter = Router();
enseignantRouter.use(exigerAuthentification);

enseignantRouter.get("/enseignant/profil", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const enseignant = await obtenirProfil(req.enseignantId!);
    res.json({
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      matiere: enseignant.matiere?.nom ?? null,
    });
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

enseignantRouter.put("/enseignant/matiere", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { nom } = parserOuErreur(schemaMatiere, req.body);
    const enseignant = await definirMatiere(req.enseignantId!, nom);
    res.json({ matiere: enseignant.matiere?.nom ?? null });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

enseignantRouter.put("/enseignant/profil", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const donnees = parserOuErreur(schemaProfil, req.body);
    const enseignant = await mettreAJourProfil(req.enseignantId!, donnees);
    res.json({
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      matiere: enseignant.matiere?.nom ?? null,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
