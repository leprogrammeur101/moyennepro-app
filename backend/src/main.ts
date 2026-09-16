import "reflect-metadata";
import express from "express";
import cors from "cors";
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

const app = express();
app.use(cors());
app.use(express.json());

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
