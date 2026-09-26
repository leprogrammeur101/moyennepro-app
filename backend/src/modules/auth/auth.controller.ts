import { Router, Request, Response } from "express";
import { inscrire, connecter, connecterAvecGoogle } from "./auth.service";
import {
  parserOuErreur,
  schemaInscription,
  schemaConnexion,
} from "../../lib/validation";

export const authRouter = Router();

authRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const donnees = parserOuErreur(schemaInscription, req.body);
    const session = await inscrire(
      donnees.nom,
      donnees.prenom,
      donnees.email,
      donnees.mot_de_passe,
      donnees.matiere
    );
    res.status(201).json(session);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const donnees = parserOuErreur(schemaConnexion, req.body);
    const session = await connecter(donnees.email, donnees.mot_de_passe);
    res.json(session);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

// Connexion/inscription en un clic avec Google : { credential } est le
// jeton d'identité (ID token) renvoyé par Google Identity Services côté frontend.
authRouter.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Jeton Google manquant." });
    }
    const session = await connecterAvecGoogle(credential);
    res.json(session);
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ message: "Connexion Google impossible." });
  }
});