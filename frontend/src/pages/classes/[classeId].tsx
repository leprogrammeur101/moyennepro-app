import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listerEleves,
  listerDevoirs,
  creerDevoir,
  supprimerDevoir,
  listerPeriodes,
  creerPeriode,
  Devoir,
  Periode,
  TypeDevoir,
} from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";
import BoutonRetour from "../../components/BoutonRetour";
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";

export default function DetailClasse() {
  useRequireAuth();
  const router = useRouter();
  const { classeId } = router.query;

  const [nombreEleves, setNombreEleves] = useState(0);
  const [chargementEleves, setChargementEleves] = useState(true);

  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [chargementDevoirs, setChargementDevoirs] = useState(true);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [afficherFormulaireDevoir, setAfficherFormulaireDevoir] =
    useState(false);
  const [nomDevoir, setNomDevoir] = useState("");
  const [typeDevoir, setTypeDevoir] = useState<TypeDevoir>("DEVOIR");
  const [periodeId, setPeriodeId] = useState("");
  const [dateDevoir, setDateDevoir] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const { showToast } = useToast();

  function chargerEleves() {
    if (!classeId) return;
    setChargementEleves(true);
    listerEleves(classeId as string)
      .then((liste) => setNombreEleves(liste.length))
      .finally(() => setChargementEleves(false));
  }

  function chargerDevoirs() {
    if (!classeId) return;
    setChargementDevoirs(true);
    listerDevoirs(classeId as string)
      .then(setDevoirs)
      .finally(() => setChargementDevoirs(false));
  }

  useEffect(() => {
    chargerEleves();
    chargerDevoirs();
    listerPeriodes().then((liste) => {
      setPeriodes(liste);
      if (liste.length > 0) setPeriodeId(liste[0].id);
    });
  }, [classeId]);

  async function creerPeriodeParDefaut() {
    const periode = await creerPeriode({
      nom: "Trimestre 1",
      annee_scolaire: "2026-2027",
      date_debut: "2026-09-01",
      date_fin: "2026-12-20",
    });
    setPeriodes([periode]);
    setPeriodeId(periode.id);
  }

  async function soumettreNouveauDevoir(e: React.FormEvent) {
    e.preventDefault();
    if (!classeId || !periodeId) return;

    try {
      await creerDevoir(classeId as string, {
        nom: nomDevoir,
        type: typeDevoir,
        periodeId,
        date: dateDevoir,
      });
      setNomDevoir("");
      setAfficherFormulaireDevoir(false);
      chargerDevoirs();
      showToast("Devoir créé", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de créer le devoir",
        "error"
      );
    }
  }

  async function gererSuppressionDevoir(devoirId: string) {
    if (!classeId) return;
    if (!confirm("Supprimer ce devoir et toutes les notes associées ?")) return;

    try {
      await supprimerDevoir(classeId as string, devoirId);
      chargerDevoirs();
      showToast("Devoir supprimé", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de supprimer le devoir",
        "error"
      );
    }
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto w-full">
        <BoutonRetour href="/classes" label="Mes classes" />

        <h1 className="font-landing italic text-xl sm:text-2xl mb-4">
          Classe
        </h1>

        <Link
          href={`/classes/${classeId}/eleves`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 mb-6 hover:border-champagne/30 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-medium">Élèves</p>
            <p className="text-sm text-ivoire/50">
              {chargementEleves
                ? "Chargement…"
                : nombreEleves === 0
                  ? "Aucun élève — ajouter ou importer"
                  : `${nombreEleves} élève${nombreEleves > 1 ? "s" : ""}`}
            </p>
          </div>
          <span className="text-champagne text-sm shrink-0">Gérer →</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-landing italic text-base sm:text-lg">
            Devoirs et interrogations
          </h2>
          {nombreEleves > 0 && (
            <button
              onClick={() => setAfficherFormulaireDevoir((v) => !v)}
              className="text-sm text-champagne shrink-0"
            >
              {afficherFormulaireDevoir ? "Annuler" : "+ Nouveau"}
            </button>
          )}
        </div>

        {nombreEleves === 0 && !chargementEleves && (
          <p className="text-sm text-ivoire/50 mb-4 leading-relaxed">
            Ajoute des élèves avant de créer des devoirs.{" "}
            <Link
              href={`/classes/${classeId}/eleves`}
              className="underline text-champagne"
            >
              Gérer les élèves
            </Link>
            .
          </p>
        )}

        {afficherFormulaireDevoir && (
          <form
            onSubmit={soumettreNouveauDevoir}
            className="space-y-3 bg-obsidienne-light rounded-2xl border border-champagne/10 p-3 sm:p-4 mb-4"
          >
            {periodes.length === 0 ? (
              <div className="text-sm text-champagne/80">
                Aucune période créée.{" "}
                <button
                  type="button"
                  onClick={creerPeriodeParDefaut}
                  className="underline text-champagne"
                >
                  Créer "Trimestre 1" (2026-2027)
                </button>
              </div>
            ) : (
              <>
                <input
                  placeholder="Nom (ex. Interrogation 1)"
                  value={nomDevoir}
                  onChange={(e) => setNomDevoir(e.target.value)}
                  required
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <select
                  value={typeDevoir}
                  onChange={(e) =>
                    setTypeDevoir(e.target.value as TypeDevoir)
                  }
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm focus:outline-none focus:border-champagne/40"
                >
                  <option value="DEVOIR">Devoir (/20, coefficient 1)</option>
                  <option value="INTERROGATION">
                    Interrogation (/10, coefficient 0,5)
                  </option>
                </select>
                <select
                  value={periodeId}
                  onChange={(e) => setPeriodeId(e.target.value)}
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm focus:outline-none focus:border-champagne/40"
                >
                  {periodes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} ({p.annee_scolaire})
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={dateDevoir}
                  onChange={(e) => setDateDevoir(e.target.value)}
                  required
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm focus:outline-none focus:border-champagne/40"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
                >
                  Créer
                </button>
              </>
            )}
          </form>
        )}

        {chargementDevoirs ? (
          <div className="space-y-2 mb-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : devoirs.length === 0 ? (
          <p className="text-sm text-ivoire/50 mb-6">
            Aucun devoir créé pour cette classe.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {devoirs.map((devoir) => (
              <div
                key={devoir.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-2xl border border-champagne/10 bg-obsidienne-light p-3"
              >
                <Link
                  href={`/devoirs/${devoir.id}?classeId=${classeId}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium truncate">{devoir.nom}</p>
                  <p className="text-sm text-ivoire/50">
                    {devoir.type === "INTERROGATION"
                      ? "Interrogation /10"
                      : "Devoir /20"}{" "}
                    · {devoir.date}
                  </p>
                </Link>
                <button
                  onClick={() => gererSuppressionDevoir(devoir.id)}
                  className="self-end sm:self-center shrink-0 text-sm text-red-400 hover:text-red-300 px-2 py-1"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        {nombreEleves > 0 && (
          <Link
            href={`/notes/${classeId}`}
            className="inline-flex w-full sm:w-auto justify-center rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Voir moyennes et rangs
          </Link>
        )}
      </main>
    </div>
  );
}
