import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Classe } from "./Classe";
import { Note } from "./Note";

@Entity("eleves")
export class Eleve {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Classe, (classe) => classe.eleves, { onDelete: "CASCADE" })
  classe!: Classe;

  @Column()
  nom!: string;

  @Column()
  prenom!: string;

  @Column({ nullable: true })
  matricule?: string;

  @OneToMany(() => Note, (note) => note.eleve)
  notes!: Note[];
}
