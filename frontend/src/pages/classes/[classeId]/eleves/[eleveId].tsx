import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  obtenirFicheEleve,
  listerPeriodes,
  FicheEleve,
  Periode,
} from "../../../../lib/api";
import { useRequireAuth } from "../../../../lib/useAuth";
import Navbar from "../../../../components/Navbar";
import BoutonRetour from "../../../../components/BoutonRetour";
import { Skeleton, SkeletonTableau } from "../../../../components/Skeleton";

export default function FicheElevePage() {
  useRequireAuth();
  const router = useRouter();
  const { classeId, eleveId } = router.query;

  const [fiche, setFiche] = useState<FicheEleve | null>(null);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState<string>("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerPeriodes().then((liste) => {
      setPeriodes(liste);
    });
  }, []);

  useEffect(() => {
    if (!classeId || !eleveId) return;
    setChargement(true);
    setErreur(null);
    obtenirFicheEleve(
      classeId as string,
      eleveId as string,
      periodeId || undefined
    )
      .then(setFiche)
      .catch((err: any) => {
        setErreur(
          err?.response?.data?.message || "Impossible de charger la fiche."
        );
        setFiche(null);
      })
      .finally(() => setChargement(false));
  }, [classeId, eleveId, periodeId]);

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto w-full">
        <BoutonRetour
          href={`/classes/${classeId}/eleves`}
          label="Liste des élèves"
        />

        {chargement ? (
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-6" />
            <Skeleton className="h-10 w-full mb-4 rounded-xl" />
            <SkeletonTableau rows={5} />
          </div>
        ) : erreur ? (
          <p className="text-sm text-red-400">{erreur}</p>
        ) : !fiche ? (
          <p className="text-sm text-ivoire/50">Élève introuvable.</p>
        ) : (
          <>
            <h1 className="font-landing italic text-xl sm:text-2xl mb-1">
              {fiche.eleve.nom} {fiche.eleve.prenom}
            </h1>
            {fiche.eleve.matricule && (
              <p className="text-sm text-ivoire/50 mb-1">
                Matricule : {fiche.eleve.matricule}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-3 mb-5">
              <div className="rounded-xl border border-champagne/20 bg-champagne/10 px-3 py-2">
                <p className="text-xs text-ivoire/50">Moyenne</p>
                <p className="text-lg font-medium text-champagne">
                  {fiche.moyenne !== null ? fiche.moyenne : "—"}
                </p>
              </div>
              {periodes.length > 0 && (
                <select
                  value={periodeId}
                  onChange={(e) => setPeriodeId(e.target.value)}
                  className="rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
                >
                  <option value="">Toutes les périodes</option>
                  {periodes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} ({p.annee_scolaire})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <h2 className="font-landing italic text-base mb-3">Notes</h2>

            {fiche.notes.length === 0 ? (
              <p className="text-sm text-ivoire/50">
                Aucun devoir pour cette période / classe.
              </p>
            ) : (
              <ul className="space-y-2">
                {fiche.notes.map((n) => (
                  <li
                    key={n.devoirId}
                    className="rounded-xl border border-champagne/10 bg-obsidienne-light px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {n.devoirNom}
                        </p>
                        <p className="text-xs text-ivoire/50 mt-0.5">
                          {n.type === "INTERROGATION"
                            ? "Interrogation"
                            : "Devoir"}{" "}
                          /{n.baremeMax} · coeff. {n.coefficient} · {n.date}
                          {!periodeId && ` · ${n.periodeNom}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {n.absent ? (
                          <span className="text-sm text-amber-400/90">
                            Absent
                          </span>
                        ) : n.valeur !== null ? (
                          <span className="text-sm font-medium text-champagne">
                            {n.valeur}
                            <span className="text-ivoire/40 font-normal">
                              /{n.baremeMax}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-ivoire/40">—</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/devoirs/${n.devoirId}?classeId=${classeId}`}
                      className="inline-block mt-2 text-xs text-champagne/80 hover:text-champagne"
                    >
                      Ouvrir la grille de saisie →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
