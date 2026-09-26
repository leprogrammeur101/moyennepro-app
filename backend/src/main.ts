import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import { notesRouter } from "./modules/notes/notes.controller";
import { authRouter } from "./modules/auth/auth.controller";
import { classesRouter } from "./modules/classes/classes.controller";
import { devoirsRouter } from "./modules/classes/devoirs.controller";
import { periodesRouter } from "./modules/periodes/periodes.controller";
import { importRouter } from "./modules/import/import.controller";
import { exportRouter } from "./modules/export/export.controller";
import { abonnementsRouter } from "./modules/abonnements/abonnements.controller";
import { matieresRouter } from "./modules/matieres/matieres.controller";
import { enseignantRouter } from "./modules/enseignant/enseignant.controller";
import { initialiserMatieresParDefaut } from "./modules/matieres/matieres.service";

dotenv.config();

// Fail-fast en production si le secret JWT est faible ou absent
const JWT_SECRET = process.env.JWT_SECRET;
if (
  process.env.NODE_ENV === "production" &&
  (!JWT_SECRET ||
    JWT_SECRET === "change_this_secret_in_production" ||
    JWT_SECRET.length < 32)
) {
  console.error(
    "FATAL: JWT_SECRET doit être défini et fort (≥ 32 caractères) en production."
  );
  process.exit(1);
}

const app = express();

// Headers de sécurité
app.use(helmet());

// CORS restreint
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", FRONTEND_URL],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// Rate-limit strict sur les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 tentatives / IP / fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives. Réessaie dans 15 minutes." },
});

app.use("/api/auth", authLimiter);

app.use("/api", authRouter);
app.use("/api", classesRouter);
app.use("/api", devoirsRouter);
app.use("/api", periodesRouter);
app.use("/api", importRouter);
app.use("/api", exportRouter);
app.use("/api", abonnementsRouter);
app.use("/api", matieresRouter);
app.use("/api", enseignantRouter);
app.use("/api", notesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(async () => {
    console.log("Connexion à la base de données établie");
    await initialiserMatieresParDefaut();
    app.listen(PORT, () => {
      console.log(`API démarrée sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base de données :", err);
    process.exit(1);
  });