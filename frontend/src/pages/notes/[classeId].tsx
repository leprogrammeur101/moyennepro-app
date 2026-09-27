import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  getResultatsClasse,
  listerPeriodes,
  telechargerPdfResultats,
  ResultatClasse,
  Periode,
} from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";
import BoutonRetour from "../../components/BoutonRetour";
import { Skeleton, SkeletonTableau } from "../../components/Skeleton";
import ModaleUpgrade from "../../components/ModaleUpgrade";
import { useToast } from "../../components/Toast";

function echapperCsv(valeur: string): string {
  if (/[",\n\r]/.test(valeur)) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

export default function ResultatsClasse() {
  useRequireAuth();
  const router = useRouter();
  const { classeId } = router.query;

  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState("");
  const [resultats, setResultats] = useState<ResultatClasse | null>(null);
  const [chargement, setChargement] = useState(true);
  const [export_, setExport] = useState(false);
  const { showToast } = useToast();
  const [modaleUpgradeOuverte, setModaleUpgradeOuverte] = useState(false);
  const [messageLimite, setMessageLimite] = useState("");

  useEffect(() => {
    listerPeriodes().then((liste) => {
      setPeriodes(liste);
      if (liste.length > 0) setPeriodeId(liste[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classeId || !periodeId) return;
    setChargement(true);
    getResultatsClasse(classeId as string, periodeId)
      .then(setResultats)
      .finally(() => setChargement(false));
  }, [classeId, periodeId]);

  function exporterCsv() {
    if (!resultats) return;
    const periode = periodes.find((p) => p.id === periodeId);
    const nomPeriode = periode
      ? `${periode.nom}_${periode.annee_scolaire}`.
          replace(/\s+/g, "_")
          .replace(/[^\w\-.]/g, "")
      : "periode";

    const enTete = ["Matricule", "Nom", "Prénom", "Moyenne", "Rang"];
    const lignes = resultats.resultats.map((r) =>
      [
        echapperCsv(r.matricule || ""),
        echapperCsv(r.nom),
        echapperCsv(r.prenom),
        r.moyenne !== null && r.moyenne !== undefined ? String(r.moyenne) : "",
        r.rang !== null && r.rang !== undefined ? String(r.rang) : "",
      ].join(";")
    );

    // BOM UTF-8 + séparateur ; pour ouverture correcte dans Excel FR/CI
    const contenu =
      "\uFEFF" + [enTete.join(";"), ...lignes].join("\r\n") + "\r\n";
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `resultats_${nomPeriode}.csv`;
    lien.click();
    window.URL.revokeObjectURL(url);
    showToast("CSV téléchargé", "success");
  }

  async function telechargerPdf() {
    if (!classeId || !periodeId) return;
    setExport(true);
    try {
      const blob = await telechargerPdfResultats(
        classeId as string,
        periodeId
      );
      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "resultats.pdf";
      lien.click();
      window.URL.revokeObjectURL(url);
      showToast("PDF téléchargé", "success");
    } catch (err: any) {
      if (
        err?.response?.status === 403 ||
        err?.response?.data?.code === "LIMITE_PDF"
      ) {
        setMessageLimite(
          err?.response?.data?.message ||
            "Limite de 5 exports PDF / mois atteinte."
        );
        setModaleUpgradeOuverte(true);
      } else {
        showToast(
          err?.response?.data?.message || "Erreur lors de l'export PDF",
          "error"
        );
      }
    } finally {
      setExport(false);
    }
  }

  const hrefRetour = classeId ? `/classes/${classeId}` : "/classes";

  if (periodes.length === 0) {
    return (
      <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
        <Navbar />
        <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto">
          <BoutonRetour href={hrefRetour} label="Retour à la classe" />
          <p className="text-sm text-ivoire/50">
            Aucune période créée pour l'instant — crée-en une depuis la
            page de la classe.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto w-full">
        <BoutonRetour href={hrefRetour} label="Retour à la classe" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h1 className="font-landing italic text-xl sm:text-2xl">
            Moyennes et rangs
          </h1>
          <select
            value={periodeId}
            onChange={(e) => setPeriodeId(e.target.value)}
            className="w-full sm:w-auto max-w-full rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
          >
            {periodes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.annee_scolaire})
              </option>
            ))}
          </select>
        </div>

        {chargement ? (
          <div>
            <Skeleton className="h-4 w-56 mb-4" />
            <SkeletonTableau rows={8} />
          </div>
        ) : !resultats ? (
          <p className="text-sm text-red-400">
            Impossible de charger les résultats.
          </p>
        ) : (
          <>
            <p className="text-sm text-ivoire/50 mb-4 leading-relaxed">
              Complétude de la saisie : {resultats.completude}%
              {resultats.completude < 100 &&
                " — le rang s'affichera une fois toutes les notes saisies"}
            </p>

            <div className="sm:hidden space-y-2 mb-4">
              {resultats.resultats.map((r) => (
                <div
                  key={r.eleveId}
                  className="rounded-xl border border-champagne/10 bg-obsidienne-light px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 truncate">
                    <span className="text-sm font-medium">
                      {r.nom} {r.prenom}
                    </span>
                    {r.matricule && (
                      <span className="block text-xs text-ivoire/45 font-mono">
                        {r.matricule}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-4 text-sm shrink-0">
                    <span className="text-ivoire/70">{r.moyenne ?? "—"}</span>
                    <span
                      className={
                        r.rang === 1
                          ? "text-champagne font-medium"
                          : "text-ivoire/60"
                      }
                    >
                      {r.rang ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-1 mb-4">
              <table className="w-full text-sm border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden">
                <thead>
                  <tr>
                    <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">
                      Élève
                    </th>
                    <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">
                      Moyenne
                    </th>
                    <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">
                      Rang
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultats.resultats.map((r) => (
                    <tr key={r.eleveId}>
                      <td className="border-b border-champagne/5 px-3 py-2">
                        <span className="block">
                          {r.nom} {r.prenom}
                        </span>
                        {r.matricule && (
                          <span className="text-xs text-ivoire/45 font-mono">
                            {r.matricule}
                          </span>
                        )}
                      </td>
                      <td className="border-b border-champagne/5 px-3 py-2">
                        {r.moyenne ?? "—"}
                      </td>
                      <td className="border-b border-champagne/5 px-3 py-2">
                        {r.rang === 1 ? (
                          <span className="text-champagne font-medium">
                            {r.rang}
                          </span>
                        ) : (
                          r.rang ?? "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={exporterCsv}
                className="w-full sm:w-auto rounded-xl border border-champagne/25 px-4 py-2.5 text-sm hover:border-champagne/50 transition-colors"
              >
                Exporter Excel (CSV)
              </button>
              <button
                onClick={telechargerPdf}
                disabled={export_}
                className="w-full sm:w-auto rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              >
                {export_ ? "Génération…" : "Télécharger le PDF"}
              </button>
            </div>
          </>
        )}
      </main>
      <ModaleUpgrade
        ouvert={modaleUpgradeOuverte}
        onFermer={() => setModaleUpgradeOuverte(false)}
        message={messageLimite}
      />
    </div>
  );
}
