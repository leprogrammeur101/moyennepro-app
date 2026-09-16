import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { AppDataSource } from "../../data-source";
import { Enseignant } from "../../entities/Enseignant";
import { obtenirOuCreerMatiere } from "../matieres/matieres.service";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function genererToken(enseignant: Enseignant): string {
  return jwt.sign({ sub: enseignant.id, email: enseignant.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export interface SessionAuth {
  token: string;
  enseignant: { id: string; nom: string; prenom: string; email: string; matiere: string | null };
}

function versSession(enseignant: Enseignant, token: string): SessionAuth {
  return {
    token,
    enseignant: {
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      matiere: enseignant.matiere?.nom ?? null,
    },
  };
}

export async function inscrire(
  nom: string,
  prenom: string,
  email: string,
  motDePasse: string,
  nomMatiere?: string
): Promise<SessionAuth> {
  const repo = AppDataSource.getRepository(Enseignant);

  const existant = await repo.findOne({ where: { email } });
  if (existant) {
    throw new Error("Un compte existe déjà avec cet email.");
  }

  const mot_de_passe_hash = await bcrypt.hash(motDePasse, 10);
  const enseignant = repo.create({ nom, prenom, email, mot_de_passe_hash });

  if (nomMatiere) {
    enseignant.matiere = await obtenirOuCreerMatiere(nomMatiere);
  }

  await repo.save(enseignant);

  return versSession(enseignant, genererToken(enseignant));
}

export async function connecter(email: string, motDePasse: string): Promise<SessionAuth> {
  const repo = AppDataSource.getRepository(Enseignant);
  const enseignant = await repo.findOne({ where: { email } });

  if (!enseignant || !enseignant.mot_de_passe_hash) {
    // Message volontairement générique (ne pas confirmer si l'email existe,
    // et gérer le cas d'un compte créé uniquement via Google)
    throw new Error("Email ou mot de passe incorrect.");
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, enseignant.mot_de_passe_hash);
  if (!motDePasseValide) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  return versSession(enseignant, genererToken(enseignant));
}

/**
 * Connexion/inscription en un clic via Google. Le frontend envoie le jeton
 * d'identité (ID token) obtenu via Google Identity Services ; on le
 * vérifie côté serveur avant de créer ou récupérer le compte enseignant.
 */
export async function connecterAvecGoogle(idToken: string): Promise<SessionAuth> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new Error("Jeton Google invalide.");
  }

  const repo = AppDataSource.getRepository(Enseignant);

  // 1. Compte déjà lié à ce Google ID
  let enseignant = await repo.findOne({ where: { google_id: payload.sub } });

  // 2. Sinon, compte existant avec le même email (créé au départ en email/mot de passe)
  //    -> on le relie au compte Google plutôt que d'en créer un doublon
  if (!enseignant) {
    enseignant = await repo.findOne({ where: { email: payload.email } });
    if (enseignant) {
      enseignant.google_id = payload.sub;
      await repo.save(enseignant);
    }
  }

  // 3. Sinon, création d'un nouveau compte
  if (!enseignant) {
    enseignant = repo.create({
      nom: payload.family_name || "",
      prenom: payload.given_name || "",
      email: payload.email,
      google_id: payload.sub,
    });
    await repo.save(enseignant);
  }

  return versSession(enseignant, genererToken(enseignant));
}

export function verifierToken(token: string): { sub: string; email: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
}
