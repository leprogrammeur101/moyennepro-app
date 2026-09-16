import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Abonnement } from "./Abonnement";

@Entity("paiements")
export class Paiement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Abonnement, (abonnement) => abonnement.paiements, { onDelete: "CASCADE" })
  abonnement!: Abonnement;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  montant!: number; // en FCFA

  @Column()
  methode!: string; // ex: "Orange Money", "MTN Money", "Wave"

  @Column({ nullable: true })
  reference_transaction?: string;

  @CreateDateColumn()
  date!: Date;
}
