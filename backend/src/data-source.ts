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

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "notes_moyenne",
  synchronize: process.env.NODE_ENV !== "production", // à désactiver en prod (utiliser des migrations)
  logging: false,
  entities: [Enseignant, Matiere, Classe, Eleve, Periode, Devoir, Note, Abonnement, Paiement],
  migrations: ["src/migrations/*.ts"],
});
