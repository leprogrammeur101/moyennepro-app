import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm";
import { Devoir } from "./Devoir";
import { Eleve } from "./Eleve";

@Entity("notes")
@Unique(["devoir", "eleve"]) // une seule note par élève et par devoir
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Devoir, (devoir) => devoir.notes, { onDelete: "CASCADE" })
  devoir!: Devoir;

  @ManyToOne(() => Eleve, (eleve) => eleve.notes, { onDelete: "CASCADE" })
  eleve!: Eleve;

  // Si absent = true, valeur est forcée à 0 mais le coefficient du devoir
  // reste inclus dans le calcul de la moyenne (règle validée avec Soro).
  @Column({ type: "decimal", precision: 4, scale: 2 })
  valeur!: number;

  @Column({ default: false })
  absent!: boolean;
}
