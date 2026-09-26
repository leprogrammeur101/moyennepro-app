import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listerEleves,
  ajouterEleve,
  supprimerEleve,
  Eleve,
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
import { Skeleton } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";

export default function DetailClasse() {
  useRequireAuth();
  const router = useRouter();
  const { classeId } = router.query;

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [chargementEleves, setChargementEleves] = useState(true);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
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
      .then(setEleves)
      .finally(() => setChargementEleves(false));
  }

  function chargerDevoirs() {
    if (!classeId) return;
    listerDevoirs(classeId as string).then(setDevoirs);
  }

  useEffect(() => {
    chargerEleves();
    chargerDevoirs();
    listerPeriodes().then((liste) => {
      setPeriodes(liste);
      if (liste.length > 0) setPeriodeId(liste[0].id);
    });
  }, [classeId]);

  async function soumettreNouvelEleve(e: React.FormEvent) {
    e.preventDefault();
    if (!classeId) return;
    try {
      await ajouterEleve(classeId as string, { nom, prenom });
      setNom("");
      setPrenom("");
      chargerEleves();
      showToast("Élève ajouté", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible d'ajouter l'élève",
        "error"
      );
    }
  }

  async function gererSuppressionEleve(eleveId: string) {
    if (!classeId) return;
    try {
      await supprimerEleve(classeId as string, eleveId);
      chargerEleves();
      showToast("Élève supprimé", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de supprimer l'élève",
        "error"
      );
    }
  }

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
        <Link
          href="/classes"
          className="text-sm text-ivoire/50 mb-4 inline-block hover:text-champagne transition-colors"
        >
          ← Mes classes
        </Link>

        {/* --- Élèves --- */}
        <h1 className="font-landing italic text-xl sm:text-2xl mb-4">
          Élèves de la classe
        </h1>

        {/* Formulaire ajout élève : empilé sur mobile, ligne sur sm+ */}
        <form
          onSubmit={soumettreNouvelEleve}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <input
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className="w-full sm:flex-1 min-w-0 rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />
          <input
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
            className="w-full sm:flex-1 min-w-0 rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />
          <button
            type="submit"
            className="w-full sm:w-auto shrink-0 rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Ajouter
          </button>
        </form>

        {chargementEleves ? (
          <div className="space-y-2 mb-6">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : eleves.length === 0 ? (
          <p className="text-sm text-ivoire/50 mb-6 leading-relaxed">
            Aucun élève pour l'instant — ajoute-les un par un ci-dessus, ou{" "}
            <Link href="/import" className="underline text-champagne">
              importe-les depuis un fichier Excel
            </Link>
            .
          </p>
        ) : (
          <>
            {/* Cartes — mobile */}
            <ul className="sm:hidden space-y-2 mb-6">
              {eleves.map((eleve) => (
                <li
                  key={eleve.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-champagne/10 bg-obsidienne-light px-3 py-3"
                >
                  <span className="text-sm font-medium min-w-0 truncate">
                    {eleve.nom} {eleve.prenom}
                  </span>
                  <button
                    onClick={() => gererSuppressionEleve(eleve.id)}
                    className="shrink-0 text-xs text-red-400 hover:text-red-300 px-2 py-1"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>

            {/* Tableau — tablette / desktop */}
            <div className="hidden sm:block overflow-x-auto mb-6 -mx-1">
              <table className="w-full text-sm border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden">
                <thead>
                  <tr>
                    <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">
                      Nom
                    </th>
                    <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">
                      Prénom
                    </th>
                    <th className="border-b border-champagne/10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((eleve) => (
                    <tr key={eleve.id}>
                      <td className="border-b border-champagne/5 px-3 py-2">
                        {eleve.nom}
                      </td>
                      <td className="border-b border-champagne/5 px-3 py-2">
                        {eleve.prenom}
                      </td>
                      <td className="border-b border-champagne/5 px-3 py-2 text-right">
                        <button
                          onClick={() => gererSuppressionEleve(eleve.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- Devoirs --- */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-landing italic text-base sm:text-lg">
            Devoirs et interrogations
          </h2>
          {eleves.length > 0 && (
            <button
              onClick={() => setAfficherFormulaireDevoir((v) => !v)}
              className="text-sm text-champagne shrink-0"
            >
              {afficherFormulaireDevoir ? "Annuler" : "+ Nouveau"}
            </button>
          )}
        </div>

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

        {devoirs.length === 0 ? (
          <p className="text-sm text-ivoire/50">
            Aucun devoir créé pour cette classe.
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {devoirs.map((devoir) => (
              <div
                key={devoir.id}
                className="flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 rounded-2xl border border-champagne/10 bg-obsidienne-light p-3"
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

        {eleves.length > 0 && (
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
