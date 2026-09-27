import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Matiere } from "./Matiere";
import { Classe } from "./Classe";
import { Abonnement } from "./Abonnement";

@Entity("enseignants")
export class Enseignant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nom!: string;

  @Column()
  prenom!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  telephone?: string;

  @Column({ nullable: true })
  mot_de_passe_hash?: string; // absent pour les comptes créés via Google

  @Column({ unique: true, nullable: true })
  google_id?: string;

  /** Hash du token de réinitialisation (jamais stocké en clair) */
  @Column({ type: "varchar", nullable: true })
  reset_token_hash?: string | null;

  /** Expiration du token de réinitialisation */
  @Column({ type: "timestamptz", nullable: true })
  reset_token_expires?: Date | null;

  @ManyToOne(() => Matiere, (matiere) => matiere.enseignants, { eager: true, nullable: true })
  matiere?: Matiere;

  @OneToMany(() => Classe, (classe) => classe.enseignant)
  classes!: Classe[];

  @OneToMany(() => Abonnement, (abonnement) => abonnement.enseignant)
  abonnements!: Abonnement[];

  @CreateDateColumn()
  date_creation!: Date;
}
