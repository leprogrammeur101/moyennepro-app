import { Request, Response, NextFunction } from "express";
import { verifierToken } from "./auth.service";

export const COOKIE_TOKEN_NAME = "moyennepro_token";

export interface RequeteAuthentifiee extends Request {
  enseignantId?: string;
}

function extraireToken(req: Request): string | null {
  // 1. Cookie HttpOnly (préféré)
  const cookieToken = req.cookies?.[COOKIE_TOKEN_NAME];
  if (cookieToken && typeof cookieToken === "string") {
    return cookieToken;
  }
  // 2. Fallback Authorization Bearer (clients API / transition)
  const enTete = req.headers.authorization;
  if (enTete && enTete.startsWith("Bearer ")) {
    return enTete.slice("Bearer ".length);
  }
  return null;
}

export function exigerAuthentification(
  req: RequeteAuthentifiee,
  res: Response,
  next: NextFunction
) {
  const token = extraireToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  try {
    const payload = verifierToken(token);
    req.enseignantId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée." });
  }
}
