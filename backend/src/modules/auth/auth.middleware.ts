import { Request, Response, NextFunction } from "express";
import { verifierToken } from "./auth.service";

export interface RequeteAuthentifiee extends Request {
  enseignantId?: string;
}

export function exigerAuthentification(
  req: RequeteAuthentifiee,
  res: Response,
  next: NextFunction
) {
  const enTete = req.headers.authorization;
  if (!enTete || !enTete.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  try {
    const token = enTete.slice("Bearer ".length);
    const payload = verifierToken(token);
    req.enseignantId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Session invalide ou expirée." });
  }
}
