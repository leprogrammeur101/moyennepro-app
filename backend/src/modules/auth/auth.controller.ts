import { Router, Request, Response } from "express";
import { inscrire, connecter, connecterAvecGoogle } from "./auth.service";
import {
  parserOuErreur,
  schemaInscription,
  schemaConnexion,
} from "../../lib/validation";
import { COOKIE_TOKEN_NAME } from "./auth.middleware";

export const authRouter = Router();

const isProd = process.env.NODE_ENV === "production";

/** Options du cookie de session JWT */
function optionsCookieToken(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  path: string;
} {
  // 7 jours par défaut (aligné sur JWT_EXPIRES_IN)
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    // En prod (HTTPS, domaines distincts) : SameSite=None + Secure
    // En dev (localhost cross-port) : Lax fonctionne souvent ; sinon None si HTTPS local
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge,
    path: "/",
  };
}

function poserCookieSession(res: Response, token: string) {
  res.cookie(COOKIE_TOKEN_NAME, token, optionsCookieToken());
}

function effacerCookieSession(res: Response) {
  res.clearCookie(COOKIE_TOKEN_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

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
    poserCookieSession(res, session.token);
    // Ne pas renvoyer le token dans le body (il est dans le cookie HttpOnly)
    res.status(201).json({ enseignant: session.enseignant });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

authRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const donnees = parserOuErreur(schemaConnexion, req.body);
    const session = await connecter(donnees.email, donnees.mot_de_passe);
    poserCookieSession(res, session.token);
    res.json({ enseignant: session.enseignant });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

// Connexion/inscription en un clic avec Google
authRouter.post("/auth/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ message: "Jeton Google manquant." });
    }
    const session = await connecterAvecGoogle(credential);
    poserCookieSession(res, session.token);
    res.json({ enseignant: session.enseignant });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({ message: "Connexion Google impossible." });
  }
});

/** Déconnexion : efface le cookie HttpOnly */
authRouter.post("/auth/logout", (_req: Request, res: Response) => {
  effacerCookieSession(res);
  res.json({ message: "Déconnecté." });
});
