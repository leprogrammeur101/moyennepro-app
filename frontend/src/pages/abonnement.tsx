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
import BoutonRetour from "../components/BoutonRetour";
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
      window.location.href = paymentUrl;
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
        <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto">
          <BoutonRetour href="/dashboard" label="Tableau de bord" />
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

  const modeBeta = abonnement?.modeBeta === true;

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto">
        <BoutonRetour href="/dashboard" label="Tableau de bord" />
        <h1 className="font-landing italic text-2xl mb-4">Mon abonnement</h1>

        {modeBeta && (
          <div className="rounded-2xl border border-champagne/25 bg-champagne/10 p-4 mb-6">
            <p className="font-medium text-champagne mb-1">
              Phase beta — tout est gratuit
            </p>
            <p className="text-sm text-ivoire/70 leading-relaxed">
              Classes et exports PDF illimités pendant la phase de test.
              Les abonnements payants seront proposés plus tard : rien à payer
              pour l'instant.
            </p>
          </div>
        )}

        {abonnement && (
          <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 mb-6">
            <p className="text-sm text-ivoire/50">Plan actuel</p>
            <p className="font-medium">
              {modeBeta ? "Beta gratuite (illimité)" : LIBELLE_PLAN[abonnement.plan]}
            </p>
            <p className="text-sm text-ivoire/50 mt-1">
              Statut :{" "}
              {modeBeta
                ? "Accès complet"
                : LIBELLE_STATUT[abonnement.statut] ?? abonnement.statut}
              {!modeBeta &&
                abonnement.date_fin &&
                ` · jusqu'au ${abonnement.date_fin}`}
            </p>
          </div>
        )}

        {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}

        {!modeBeta && (
          <>
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
                      <p className="text-sm text-ivoire/50">
                        {p.prix.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                    <button
                      onClick={() => gererSouscription(p.plan)}
                      disabled={
                        enCours === p.plan || abonnement?.plan === p.plan
                      }
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
              Le paiement s'effectue via Mobile Money (Orange Money, MTN
              Money, Wave) sur la page sécurisée CinetPay.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
