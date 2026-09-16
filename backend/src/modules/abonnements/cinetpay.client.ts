import axios from "axios";

const CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2";

export interface DemandePaiement {
  transactionId: string;
  montant: number;
  description: string;
}

/**
 * Initialise un paiement CinetPay et retourne l'URL de paiement vers
 * laquelle rediriger l'enseignant (choix Orange Money / MTN Money / Wave
 * se fait sur la page CinetPay elle-même).
 */
export async function initierPaiementCinetPay(demande: DemandePaiement): Promise<string> {
  const { data } = await axios.post(`${CINETPAY_BASE_URL}/payment`, {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: demande.transactionId,
    amount: demande.montant,
    currency: "XOF",
    description: demande.description,
    notify_url: process.env.CINETPAY_NOTIFY_URL,
    return_url: process.env.CINETPAY_RETURN_URL,
    channels: "MOBILE_MONEY",
  });

  if (data.code !== "201") {
    throw new Error(data.message || "Échec de l'initialisation du paiement CinetPay.");
  }

  return data.data.payment_url as string;
}

export type StatutPaiement = "ACCEPTE" | "REFUSE" | "EN_ATTENTE";

/**
 * Vérifie le statut réel d'une transaction auprès de CinetPay.
 * Ne JAMAIS activer un abonnement sur la seule base du contenu du
 * webhook — toujours revérifier ici avant de créditer le compte.
 */
export async function verifierPaiementCinetPay(
  transactionId: string
): Promise<{ statut: StatutPaiement; montant: number }> {
  const { data } = await axios.post(`${CINETPAY_BASE_URL}/payment/check`, {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transactionId,
  });

  const statutBrut = data?.data?.status;
  const statut: StatutPaiement =
    statutBrut === "ACCEPTED" ? "ACCEPTE" : statutBrut === "REFUSED" ? "REFUSE" : "EN_ATTENTE";

  return { statut, montant: Number(data?.data?.amount ?? 0) };
}
