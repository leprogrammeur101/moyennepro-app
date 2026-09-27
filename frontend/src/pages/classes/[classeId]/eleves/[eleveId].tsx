import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  obtenirFicheEleve,
  modifierEleve,
  listerPeriodes,
  FicheEleve,
  Periode,
} from "../../../../lib/api";
import { useRequireAuth } from "../../../../lib/useAuth";
import Navbar from "../../../../components/Navbar";
import BoutonRetour from "../../../../components/BoutonRetour";
import { Skeleton, SkeletonTableau } from "../../../../components/Skeleton";
import { useToast } from "../../../../components/Toast";

const REGEX_MATRICULE = /^\d{8}[A-Za-z]$/;

export default function FicheElevePage() {
  useRequireAuth();
  const router = useRouter();
  const { classeId, eleveId } = router.query;
  const { showToast } = useToast();

  const [fiche, setFiche] = useState<FicheEleve | null>(null);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [periodeId, setPeriodeId] = useState<string>("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matricule, setMatricule] = useState("");
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    listerPeriodes().then((liste) => {
      setPeriodes(liste);
    });
  }, []);

  function chargerFiche() {
    if (!classeId || !eleveId) return;
    setChargement(true);
    setErreur(null);
    obtenirFicheEleve(
      classeId as string,
      eleveId as string,
      periodeId || undefined
    )
      .then((f) => {
        setFiche(f);
        setNom(f.eleve.nom);
        setPrenom(f.eleve.prenom);
        setMatricule(f.eleve.matricule || "");
      })
      .catch((err: any) => {
        setErreur(
          err?.response?.data?.message || "Impossible de charger la fiche."
        );
        setFiche(null);
      })
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    chargerFiche();
  }, [classeId, eleveId, periodeId]);

  async function enregistrerModifications(e: React.FormEvent) {
    e.preventDefault();
    if (!classeId || !eleveId) return;

    const mat = matricule.trim().toUpperCase();
    if (mat && !REGEX_MATRICULE.test(mat)) {
      showToast(
        "Matricule invalide : 8 chiffres + 1 lettre (ex. 12345678A)",
        "error"
      );
      return;
    }

    setSauvegarde(true);
    try {
      await modifierEleve(classeId as string, eleveId as string, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        matricule: mat || undefined,
      });
      showToast("Élève mis à jour", "success");
      setEdition(false);
      chargerFiche();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de modifier l'élève",
        "error"
      );
    } finally {
      setSauvegarde(false);
    }
  }

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
            {edition ? (
              <form
                onSubmit={enregistrerModifications}
                className="mb-6 space-y-3 rounded-2xl border border-champagne/15 bg-obsidienne-light p-4"
              >
                <p className="text-sm font-medium text-champagne mb-1">
                  Modifier l'élève
                </p>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  placeholder="Nom"
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <input
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                  placeholder="Prénom"
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <input
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="12345678A (optionnel)"
                  maxLength={9}
                  title="8 chiffres + 1 lettre"
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm font-mono placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={sauvegarde}
                    className="w-full sm:w-auto rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm disabled:opacity-60"
                  >
                    {sauvegarde ? "Enregistrement…" : "Enregistrer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEdition(false);
                      setNom(fiche.eleve.nom);
                      setPrenom(fiche.eleve.prenom);
                      setMatricule(fiche.eleve.matricule || "");
                    }}
                    className="w-full sm:w-auto rounded-xl border border-champagne/20 px-4 py-2.5 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-landing italic text-xl sm:text-2xl mb-1">
                      {fiche.eleve.nom} {fiche.eleve.prenom}
                    </h1>
                    {fiche.eleve.matricule && (
                      <p className="text-sm text-ivoire/50 font-mono">
                        {fiche.eleve.matricule}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEdition(true)}
                    className="shrink-0 text-sm text-champagne/90 hover:text-champagne underline-offset-2 hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-1 mb-5">
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
