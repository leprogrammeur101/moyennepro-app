import { AppDataSource } from "../../data-source";
import { Abonnement, PlanAbonnement, StatutAbonnement } from "../../entities/Abonnement";
import { Paiement } from "../../entities/Paiement";
import { initierPaiementCinetPay, verifierPaiementCinetPay } from "./cinetpay.client";

// Tarifs validés avec Soro (voir cahier des charges §5)
export const PRIX_PLAN: Record<PlanAbonnement, number> = {
  [PlanAbonnement.GRATUIT]: 0,
  [PlanAbonnement.TRIMESTRIEL]: 1500,
  [PlanAbonnement.ANNUEL]: 4000,
};

const DUREE_JOURS: Partial<Record<PlanAbonnement, number>> = {
  [PlanAbonnement.TRIMESTRIEL]: 90,
  [PlanAbonnement.ANNUEL]: 365,
};

/**
 * Retourne l'abonnement actif de l'enseignant. S'il n'en a aucun (ou que
 * le précédent a expiré), retourne un plan GRATUIT "virtuel" — le plan
 * gratuit n'a pas besoin d'être persisté en base, c'est l'état par défaut.
 */
export async function obtenirAbonnementActif(enseignantId: string): Promise<Abonnement> {
  const repo = AppDataSource.getRepository(Abonnement);
  let abonnement = await repo.findOne({
    where: { enseignant: { id: enseignantId }, statut: StatutAbonnement.ACTIF },
    order: { date_debut: "DESC" },
  });

  // Expiration automatique si la date de fin est dépassée
  if (abonnement?.date_fin && new Date(abonnement.date_fin) < new Date()) {
    abonnement.statut = StatutAbonnement.EXPIRE;
    await repo.save(abonnement);
    abonnement = null;
  }

  if (!abonnement) {
    return repo.create({
      enseignant: { id: enseignantId } as any,
      plan: PlanAbonnement.GRATUIT,
      date_debut: new Date().toISOString().slice(0, 10),
      statut: StatutAbonnement.ACTIF,
    });
  }

  return abonnement;
}

/**
 * Initie une souscription payante : crée l'abonnement en statut EN_ATTENTE
 * et demande à CinetPay une URL de paiement à ouvrir côté frontend.
 * L'abonnement ne passe à ACTIF qu'après confirmation via confirmerPaiement().
 */
export async function initierSouscription(
  enseignantId: string,
  plan: PlanAbonnement
): Promise<{ paymentUrl: string }> {
  if (plan === PlanAbonnement.GRATUIT) {
    throw new Error("Le plan gratuit ne nécessite pas de paiement.");
  }

  const montant = PRIX_PLAN[plan];
  const transactionId = `moyennepro-${enseignantId.slice(0, 8)}-${Date.now()}`;

  const paymentUrl = await initierPaiementCinetPay({
    transactionId,
    montant,
    description: `Abonnement MoyennePro — ${plan === PlanAbonnement.TRIMESTRIEL ? "Trimestriel" : "Annuel"}`,
  });

  const abonnementRepo = AppDataSource.getRepository(Abonnement);
  const abonnement = await abonnementRepo.save(
    abonnementRepo.create({
      enseignant: { id: enseignantId } as any,
      plan,
      date_debut: new Date().toISOString().slice(0, 10),
      statut: StatutAbonnement.EN_ATTENTE,
    })
  );

  const paiementRepo = AppDataSource.getRepository(Paiement);
  await paiementRepo.save(
    paiementRepo.create({
      abonnement,
      montant,
      methode: "Mobile Money (CinetPay)",
      reference_transaction: transactionId,
    })
  );

  return { paymentUrl };
}

/**
 * Appelé par le webhook CinetPay. Revérifie systématiquement le statut
 * auprès de CinetPay (jamais de confiance dans le corps brut du webhook,
 * qui peut être falsifié) avant d'activer l'abonnement.
 */
export async function confirmerPaiement(transactionId: string): Promise<void> {
  const paiementRepo = AppDataSource.getRepository(Paiement);
  const paiement = await paiementRepo.findOne({
    where: { reference_transaction: transactionId },
    relations: { abonnement: true },
  });
  if (!paiement) {
    throw new Error("Paiement introuvable pour cette transaction.");
  }

  const verification = await verifierPaiementCinetPay(transactionId);
  if (verification.statut !== "ACCEPTE") {
    return; // refusé ou toujours en attente : on ne fait rien
  }

  const abonnementRepo = AppDataSource.getRepository(Abonnement);
  const abonnement = paiement.abonnement;
  const dureeJours = DUREE_JOURS[abonnement.plan] ?? 0;
  const dateFin = new Date();
  dateFin.setDate(dateFin.getDate() + dureeJours);

  abonnement.statut = StatutAbonnement.ACTIF;
  abonnement.date_fin = dateFin.toISOString().slice(0, 10);
  await abonnementRepo.save(abonnement);
}

// ========== LIMITES PAR PLAN ==========
export const LIMITES_PLAN = {
  [PlanAbonnement.GRATUIT]: {
    maxClasses: 2,
    maxPdfParMois: 5,
  },
  [PlanAbonnement.TRIMESTRIEL]: {
    maxClasses: Infinity,
    maxPdfParMois: Infinity,
  },
  [PlanAbonnement.ANNUEL]: {
    maxClasses: Infinity,
    maxPdfParMois: Infinity,
  },
};

/**
 * Vérifie si l'enseignant peut créer une nouvelle classe.
 * Lance une erreur 403 si la limite du plan gratuit est atteinte.
 */
export async function verifierLimiteClasses(enseignantId: string): Promise<void> {
  const abonnement = await obtenirAbonnementActif(enseignantId);
  const limite = LIMITES_PLAN[abonnement.plan].maxClasses;

  if (limite === Infinity) return;

  const classeRepo = AppDataSource.getRepository(
    (await import("../../entities/Classe")).Classe
  );
  const nombreClasses = await classeRepo.count({
    where: { enseignant: { id: enseignantId } },
  });

  if (nombreClasses >= limite) {
    const error: any = new Error(
      `Limite atteinte : le plan Gratuit est limité à ${limite} classes. Passez à un plan payant pour en créer davantage.`
    );
    error.statusCode = 403;
    error.code = "LIMITE_CLASSES";
    throw error;
  }
}