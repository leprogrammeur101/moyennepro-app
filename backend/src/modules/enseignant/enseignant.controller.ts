import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { obtenirProfil, definirMatiere, mettreAJourProfil } from "./enseignant.service";

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
    const { nom } = req.body;
    if (!nom) {
      return res.status(400).json({ message: "Nom de matière requis." });
    }
    const enseignant = await definirMatiere(req.enseignantId!, nom);
    res.json({ matiere: enseignant.matiere?.nom ?? null });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

enseignantRouter.put("/enseignant/profil", async (req: RequeteAuthentifiee, res: Response) => {
  try {
    const { nom, prenom, matiere } = req.body;
    const enseignant = await mettreAJourProfil(req.enseignantId!, { nom, prenom, matiere });
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
