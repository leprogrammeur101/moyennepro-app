import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Enseignant } from "./Enseignant";

@Entity("matieres")
export class Matiere {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  nom!: string;

  @OneToMany(() => Enseignant, (enseignant) => enseignant.matiere)
  enseignants!: Enseignant[];
}
