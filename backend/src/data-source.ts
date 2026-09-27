import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Enseignant } from "./entities/Enseignant";
import { Matiere } from "./entities/Matiere";
import { Classe } from "./entities/Classe";
import { Eleve } from "./entities/Eleve";
import { Periode } from "./entities/Periode";
import { Devoir } from "./entities/Devoir";
import { Note } from "./entities/Note";
import { Abonnement } from "./entities/Abonnement";
import { Paiement } from "./entities/Paiement";
import { ExportCompteur } from "./entities/ExportCompteur";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// En prod, synchronize est OFF sauf si DB_SYNCHRONIZE=true (utile au 1er déploiement beta)
const synchronize =
  process.env.DB_SYNCHRONIZE === "true" ||
  (!isProd && process.env.DB_SYNCHRONIZE !== "false");

const common = {
  type: "postgres" as const,
  logging: false,
  synchronize,
  entities: [
    Enseignant,
    Matiere,
    Classe,
    Eleve,
    Periode,
    Devoir,
    Note,
    Abonnement,
    Paiement,
    ExportCompteur,
  ],
  migrations: ["src/migrations/*.ts"],
};

/**
 * Prefère DATABASE_URL (Supabase / Render) si défini.
 * Sinon retombe sur DB_HOST, DB_PORT, etc.
 */
export const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      ...common,
      url: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === "false"
          ? false
          : { rejectUnauthorized: false },
    })
  : new DataSource({
      ...common,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "notes_moyennes",
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });
