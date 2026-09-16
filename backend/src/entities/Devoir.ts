import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Classe } from "./Classe";
import { Periode } from "./Periode";
import { Note } from "./Note";

export enum TypeDevoir {
  INTERROGATION = "INTERROGATION", // notée sur 10, coefficient 0,5
  DEVOIR = "DEVOIR", // noté sur 20, coefficient 1
}

// Barème maximal et coefficient associés à chaque type — fixés par le
// système ivoirien, non modifiables par l'enseignant (cf. précision de Soro).
export const BAREME_MAX: Record<TypeDevoir, number> = {
  [TypeDevoir.INTERROGATION]: 10,
  [TypeDevoir.DEVOIR]: 20,
};

export const COEFFICIENT_PAR_TYPE: Record<TypeDevoir, number> = {
  [TypeDevoir.INTERROGATION]: 0.5,
  [TypeDevoir.DEVOIR]: 1,
};

@Entity("devoirs")
export class Devoir {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Classe, (classe) => classe.devoirs, { onDelete: "CASCADE" })
  classe!: Classe;

  @ManyToOne(() => Periode, (periode) => periode.devoirs)
  periode!: Periode;

  @Column()
  nom!: string; // ex: "Interrogation 1", "Devoir 1", "Composition"

  @Column({ type: "enum", enum: TypeDevoir })
  type!: TypeDevoir; // détermine le barème (/10 ou /20) et le coefficient (0,5 ou 1)

  @Column({ type: "date" })
  date!: string;

  @OneToMany(() => Note, (note) => note.devoir)
  notes!: Note[];
}
