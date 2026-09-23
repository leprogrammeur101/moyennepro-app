import { useEffect, useState } from "react";
import {
  obtenirAbonnementActif,
  listerPlansTarifs,
  souscrireAbonnement,
  Abonnement,
  PlanTarif,
  PlanAbonnement,
} from "../lib/api";
import { useRequireAuth } from "../lib/useAuth";
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";

const LIBELLE_PLAN: Record<PlanAbonnement, string> = {
  GRATUIT: "Gratuit",
  TRIMESTRIEL: "Trimestriel",
  ANNUEL: "Annuel",
};

const LIBELLE_STATUT: Record<string, string> = {
  EN_ATTENTE: "Paiement en attente de confirmation",
  ACTIF: "Actif",
  EXPIRE: "Expiré",
  ANNULE: "Annulé",
};

export default function PageAbonnement() {
  useRequireAuth();
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [plans, setPlans] = useState<PlanTarif[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState<PlanAbonnement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const { showToast } = useToast();


  useEffect(() => {
    Promise.all([obtenirAbonnementActif(), listerPlansTarifs()])
      .then(([a, p]) => {
        setAbonnement(a);
        setPlans(p);
      })
      .finally(() => setChargement(false));
  }, []);

  async function gererSouscription(plan: PlanAbonnement) {
    setErreur(null);
    setEnCours(plan);
    try {
      const { paymentUrl } = await souscrireAbonnement(plan);
      window.location.href = paymentUrl; // redirection vers CinetPay (choix Orange Money/MTN/Wave)
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible d'initier le paiement.",
        "error"
      );
      setEnCours(null);
    }
  }

  if (chargement) {
    return (
      <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
        <Navbar />
        <main className="p-6 max-w-xl mx-auto">
          <Skeleton className="h-8 w-44 mb-6" />
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="font-landing italic text-2xl mb-4">Mon abonnement</h1>

        {abonnement && (
          <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 mb-6">
            <p className="text-sm text-ivoire/50">Plan actuel</p>
            <p className="font-medium">{LIBELLE_PLAN[abonnement.plan]}</p>
            <p className="text-sm text-ivoire/50 mt-1">
              Statut : {LIBELLE_STATUT[abonnement.statut] ?? abonnement.statut}
              {abonnement.date_fin && ` · jusqu'au ${abonnement.date_fin}`}
            </p>
          </div>
        )}

        {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}

        <div className="space-y-3">
          {plans
            .filter((p) => p.plan !== "GRATUIT")
            .map((p) => (
              <div
                key={p.plan}
                className="flex items-center justify-between rounded-2xl border border-champagne/10 bg-obsidienne-light p-4"
              >
                <div>
                  <p className="font-medium">{LIBELLE_PLAN[p.plan]}</p>
                  <p className="text-sm text-ivoire/50">{p.prix.toLocaleString("fr-FR")} FCFA</p>
                </div>
                <button
                  onClick={() => gererSouscription(p.plan)}
                  disabled={enCours === p.plan || abonnement?.plan === p.plan}
                  className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {enCours === p.plan
                    ? "Redirection…"
                    : abonnement?.plan === p.plan
                    ? "Plan actuel"
                    : "Souscrire"}
                </button>
              </div>
            ))}
        </div>

        <p className="text-xs text-ivoire/30 mt-6">
          Le paiement s'effectue via Mobile Money (Orange Money, MTN Money, Wave) sur la page sécurisée CinetPay.
        </p>
      </main>
    </div>
  );
}
