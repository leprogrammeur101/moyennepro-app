import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Enseignant } from "./Enseignant";
import { Paiement } from "./Paiement";

export enum PlanAbonnement {
  GRATUIT = "GRATUIT",
  TRIMESTRIEL = "TRIMESTRIEL",
  ANNUEL = "ANNUEL",
}

export enum StatutAbonnement {
  EN_ATTENTE = "EN_ATTENTE", // paiement initié, pas encore confirmé par CinetPay
  ACTIF = "ACTIF",
  EXPIRE = "EXPIRE",
  ANNULE = "ANNULE",
}

@Entity("abonnements")
export class Abonnement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Enseignant, (enseignant) => enseignant.abonnements, { onDelete: "CASCADE" })
  enseignant!: Enseignant;

  @Column({ type: "enum", enum: PlanAbonnement, default: PlanAbonnement.GRATUIT })
  plan!: PlanAbonnement;

  @Column({ type: "date" })
  date_debut!: string;

  @Column({ type: "date", nullable: true })
  date_fin?: string;

  @Column({ type: "enum", enum: StatutAbonnement, default: StatutAbonnement.ACTIF })
  statut!: StatutAbonnement;

  @OneToMany(() => Paiement, (paiement) => paiement.abonnement)
  paiements!: Paiement[];
}
