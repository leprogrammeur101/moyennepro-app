import { AppDataSource } from "../../data-source";
import { Periode } from "../../entities/Periode";

export interface DonneesPeriode {
  nom: string; // ex: "Trimestre 1"
  annee_scolaire: string;
  date_debut: string;
  date_fin: string;
}

export async function creerPeriode(donnees: DonneesPeriode): Promise<Periode> {
  const repo = AppDataSource.getRepository(Periode);
  const periode = repo.create(donnees);
  return repo.save(periode);
}

export async function listerPeriodes(anneeScolaire?: string): Promise<Periode[]> {
  const repo = AppDataSource.getRepository(Periode);
  return repo.find({
    where: anneeScolaire ? { annee_scolaire: anneeScolaire } : {},
    order: { date_debut: "ASC" },
  });
}
