import { Router, Request, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { PlanAbonnement } from "../../entities/Abonnement";
import {
  obtenirAbonnementActif,
  initierSouscription,
  confirmerPaiement,
  PRIX_PLAN,
} from "./abonnements.service";

export const abonnementsRouter = Router();

abonnementsRouter.get(
  "/abonnements/actif",
  exigerAuthentification,
  async (req: RequeteAuthentifiee, res: Response) => {
    const abonnement = await obtenirAbonnementActif(req.enseignantId!);
    res.json(abonnement);
  }
);

abonnementsRouter.get("/abonnements/plans", exigerAuthentification, async (_req, res: Response) => {
  res.json(Object.entries(PRIX_PLAN).map(([plan, prix]) => ({ plan, prix })));
});

abonnementsRouter.post(
  "/abonnements/souscrire",
  exigerAuthentification,
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const { plan } = req.body as { plan: PlanAbonnement };
      const resultat = await initierSouscription(req.enseignantId!, plan);
      res.json(resultat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Webhook CinetPay — PAS de middleware d'authentification : appelé par les
// serveurs CinetPay eux-mêmes, pas par le navigateur de l'enseignant.
// La confirmation revérifie toujours le paiement auprès de CinetPay
// (voir confirmerPaiement) avant d'activer quoi que ce soit.
abonnementsRouter.post("/paiements/webhook-cinetpay", async (req: Request, res: Response) => {
  try {
    const transactionId = req.body.cpm_trans_id || req.body.transaction_id;
    if (!transactionId) {
      return res.status(400).send("transaction_id manquant");
    }
    await confirmerPaiement(transactionId);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Erreur webhook CinetPay :", err);
    res.status(500).send("Erreur");
  }
});
