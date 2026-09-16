import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Enseignant } from "./Enseignant";
import { Eleve } from "./Eleve";
import { Devoir } from "./Devoir";

@Entity("classes")
export class Classe {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Enseignant, (enseignant) => enseignant.classes, { onDelete: "CASCADE" })
  enseignant!: Enseignant;

  @Column()
  nom!: string; // ex: "3ème A"

  @Column()
  niveau!: string; // ex: "3ème", "2nde"

  @Column()
  annee_scolaire!: string; // ex: "2026-2027"

  @OneToMany(() => Eleve, (eleve) => eleve.classe)
  eleves!: Eleve[];

  @OneToMany(() => Devoir, (devoir) => devoir.classe)
  devoirs!: Devoir[];
}
