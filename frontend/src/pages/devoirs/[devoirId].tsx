import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  obtenirGrilleSaisie,
  enregistrerNotes,
  LigneSaisie,
} from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";
import { Skeleton, SkeletonTableau } from "../../components/Skeleton";
import { useToast } from "../../components/Toast";

type StatutLigne = "idle" | "saving" | "saved" | "error";

export default function SaisieNotes() {
  useRequireAuth();
  const router = useRouter();
  const { devoirId, classeId } = router.query;
  const { showToast } = useToast();

  const [nomDevoir, setNomDevoir] = useState("");
  const [baremeMax, setBaremeMax] = useState(20);
  const [lignes, setLignes] = useState<LigneSaisie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [statuts, setStatuts] = useState<Record<string, StatutLigne>>({});

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!devoirId || !classeId) return;
    obtenirGrilleSaisie(classeId as string, devoirId as string).then((grille) => {
      setNomDevoir(grille.devoir.nom);
      setBaremeMax(grille.devoir.baremeMax);
      setLignes(grille.lignes);
      setChargement(false);
    });
  }, [devoirId, classeId]);

  const notesSaisies = lignes.filter(
    (l) => !l.absent && l.valeur !== null && l.valeur !== undefined
  ).length;
  const totalEleves = lignes.length;
  const progression = totalEleves > 0 ? (notesSaisies / totalEleves) * 100 : 0;
  const estComplet = notesSaisies === totalEleves && totalEleves > 0;

  // Sauvegarde d'une seule note
  const sauvegarderNote = useCallback(
    async (ligne: LigneSaisie) => {
      if (!devoirId || !classeId) return;

      setStatuts((prev) => ({ ...prev, [ligne.eleveId]: "saving" }));

      try {
        await enregistrerNotes(classeId as string, devoirId as string, [
          {
            eleveId: ligne.eleveId,
            valeur: ligne.valeur ?? 0,
            absent: ligne.absent,
          },
        ]);
        setStatuts((prev) => ({ ...prev, [ligne.eleveId]: "saved" }));

        // Remet idle après 2s
        setTimeout(() => {
          setStatuts((prev) =>
            prev[ligne.eleveId] === "saved"
              ? { ...prev, [ligne.eleveId]: "idle" }
              : prev
          );
        }, 2000);
      } catch {
        setStatuts((prev) => ({ ...prev, [ligne.eleveId]: "error" }));
      }
    },
    [devoirId, classeId]
  );

  // Debounce 800ms
  function planifierSauvegarde(ligne: LigneSaisie) {
    const id = ligne.eleveId;
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    debounceTimers.current[id] = setTimeout(() => {
      sauvegarderNote(ligne);
    }, 800);
  }

  function modifierValeur(eleveId: string, valeur: string) {
    setLignes((prev) => {
      const nouvelles = prev.map((l) =>
        l.eleveId === eleveId
          ? { ...l, valeur: valeur === "" ? null : Number(valeur) }
          : l
      );
      const ligne = nouvelles.find((l) => l.eleveId === eleveId);
      if (ligne && !ligne.absent) {
        planifierSauvegarde(ligne);
      }
      return nouvelles;
    });
  }

  function basculerAbsent(eleveId: string) {
    setLignes((prev) => {
      const nouvelles = prev.map((l) =>
        l.eleveId === eleveId
          ? {
              ...l,
              absent: !l.absent,
              valeur: !l.absent ? null : l.valeur,
            }
          : l
      );
      const ligne = nouvelles.find((l) => l.eleveId === eleveId);
      if (ligne) {
        planifierSauvegarde(ligne);
      }
      return nouvelles;
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) {
        next.focus();
        next.select();
      }
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = inputRefs.current[index - 1];
      if (prev) {
        prev.focus();
        prev.select();
      }
    }
  }

  async function enregistrerTout() {
    if (!devoirId || !classeId) return;
    setEnregistrement(true);
    try {
      await enregistrerNotes(
        classeId as string,
        devoirId as string,
        lignes.map((l) => ({
          eleveId: l.eleveId,
          valeur: l.valeur ?? 0,
          absent: l.absent,
        }))
      );
      showToast("Toutes les notes ont été enregistrées", "success");
      // Marque tout comme sauvé
      const nouveauxStatuts: Record<string, StatutLigne> = {};
      lignes.forEach((l) => {
        nouveauxStatuts[l.eleveId] = "saved";
      });
      setStatuts(nouveauxStatuts);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Erreur lors de l'enregistrement",
        "error"
      );
    } finally {
      setEnregistrement(false);
    }
  }

  function iconeStatut(eleveId: string) {
    const s = statuts[eleveId] || "idle";
    if (s === "saving") return <span className="text-ivoire/40 text-xs">💾</span>;
    if (s === "saved") return <span className="text-champagne text-xs">✓</span>;
    if (s === "error") return <span className="text-red-400 text-xs">⚠</span>;
    return null;
  }

  if (chargement) {
    return (
      <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
        <Navbar />
        <main className="p-6 max-w-xl mx-auto">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-8 w-52 mb-2" />
          <Skeleton className="h-4 w-24 mb-6" />
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <SkeletonTableau rows={10} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <Link
          href={`/classes/${classeId}`}
          className="text-sm text-ivoire/50 mb-4 inline-block hover:text-champagne transition-colors"
        >
          ← Retour à la classe
        </Link>

        <h1 className="font-landing italic text-2xl mb-1">{nomDevoir}</h1>
        <p className="text-sm text-ivoire/50 mb-6">Noté sur {baremeMax}</p>

        {/* Compteur + barre */}
        {totalEleves > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ivoire/80">
                {notesSaisies} / {totalEleves} notes saisies
              </p>
              {estComplet && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-champagne/15 text-champagne border border-champagne/40">
                  ✓ Complet
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-obsidienne/80 rounded-full overflow-hidden border border-champagne/20">
              <div
                className="h-full bg-champagne transition-all duration-300 ease-out"
                style={{ width: `${progression}%` }}
              />
            </div>
            <p className="text-xs text-ivoire/40 mt-2">
              Sauvegarde automatique activée
            </p>
          </div>
        )}

        {/* Tableau */}
        <table className="w-full text-sm border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden mb-4">
          <thead>
            <tr>
              <th className="border-b border-champagne/10 px-3 py-2.5 text-left text-ivoire/60 font-medium">
                Élève
              </th>
              <th className="border-b border-champagne/10 px-3 py-2.5 text-left text-ivoire/60 font-medium">
                Note
              </th>
              <th className="border-b border-champagne/10 px-3 py-2.5 text-left text-ivoire/60 font-medium">
                Absent
              </th>
              <th className="border-b border-champagne/10 px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne, index) => {
              const estRemplie =
                !ligne.absent &&
                ligne.valeur !== null &&
                ligne.valeur !== undefined;

              return (
                <tr
                  key={ligne.eleveId}
                  className={`
                    border-b border-champagne/5 transition-colors
                    ${estRemplie ? "bg-champagne/[0.06]" : "bg-transparent"}
                  `}
                >
                  <td className="px-3 py-2.5">
                    {ligne.nom} {ligne.prenom}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="decimal"
                      disabled={ligne.absent}
                      value={ligne.valeur ?? ""}
                      onChange={(e) =>
                        modifierValeur(ligne.eleveId, e.target.value)
                      }
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-20 rounded-lg bg-obsidienne border border-champagne/15 px-2 py-1.5
                                 focus:outline-none focus:border-champagne/50 focus:ring-1 focus:ring-champagne/30
                                 disabled:opacity-40 disabled:cursor-not-allowed text-ivoire"
                      placeholder="—"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={ligne.absent}
                      onChange={() => basculerAbsent(ligne.eleveId)}
                      tabIndex={-1}
                      className="accent-champagne w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {iconeStatut(ligne.eleveId)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={enregistrerTout}
            disabled={enregistrement}
            className="rounded-xl bg-champagne text-obsidienne font-medium px-5 py-2.5 text-sm
                       transition-all hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer tout"}
          </button>

          <Link
            href={`/notes/${classeId}`}
            className="text-sm text-ivoire/50 hover:text-champagne transition-colors self-center"
          >
            Voir les moyennes →
          </Link>
        </div>
      </main>
    </div>
  );
}