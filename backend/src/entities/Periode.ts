import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Devoir } from "./Devoir";

@Entity("periodes")
export class Periode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nom!: string; // ex: "Trimestre 1"

  @Column()
  annee_scolaire!: string;

  @Column({ type: "date" })
  date_debut!: string;

  @Column({ type: "date" })
  date_fin!: string;

  @OneToMany(() => Devoir, (devoir) => devoir.periode)
  devoirs!: Devoir[];
}
