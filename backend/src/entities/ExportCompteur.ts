import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm";
import { Enseignant } from "./Enseignant";

@Entity("export_compteurs")
@Unique(["enseignant", "annee", "mois"])
export class ExportCompteur {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Enseignant, { onDelete: "CASCADE" })
  enseignant!: Enseignant;

  /** Année civile, ex. 2026 */
  @Column({ type: "int" })
  annee!: number;

  /** Mois 1–12 */
  @Column({ type: "int" })
  mois!: number;

  @Column({ type: "int", default: 0 })
  nombre_exports!: number;
}