import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import { obtenirGrilleSaisie, enregistrerNotes, LigneSaisie } from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";

export default function SaisieNotes() {
  useRequireAuth();
  const router = useRouter();
  const { devoirId, classeId } = router.query;

  const [nomDevoir, setNomDevoir] = useState("");
  const [baremeMax, setBaremeMax] = useState(20);
  const [lignes, setLignes] = useState<LigneSaisie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!devoirId || !classeId) return;
    obtenirGrilleSaisie(classeId as string, devoirId as string).then((grille) => {
      setNomDevoir(grille.devoir.nom);
      setBaremeMax(grille.devoir.baremeMax);
      setLignes(grille.lignes);
      setChargement(false);
    });
  }, [devoirId, classeId]);

  function modifierValeur(eleveId: string, valeur: string) {
    setLignes((prev) =>
      prev.map((l) => (l.eleveId === eleveId ? { ...l, valeur: valeur === "" ? null : Number(valeur) } : l))
    );
  }

  function basculerAbsent(eleveId: string) {
    setLignes((prev) =>
      prev.map((l) => (l.eleveId === eleveId ? { ...l, absent: !l.absent, valeur: !l.absent ? null : l.valeur } : l))
    );
  }

  async function enregistrer() {
    if (!devoirId || !classeId) return;
    setEnregistrement(true);
    setMessage(null);
    try {
      await enregistrerNotes(
        classeId as string,
        devoirId as string,
        lignes.map((l) => ({ eleveId: l.eleveId, valeur: l.valeur ?? 0, absent: l.absent }))
      );
      setMessage("Notes enregistrées.");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  }

  if (chargement) {
    return (
      <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
        <Navbar />
        <p className="p-6 text-sm text-ivoire/50">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <Link href={`/classes/${classeId}`} className="text-sm text-ivoire/50 mb-4 inline-block">
          ← Retour à la classe
        </Link>
        <h1 className="font-landing italic text-2xl mb-1">{nomDevoir}</h1>
        <p className="text-sm text-ivoire/50 mb-4">Noté sur {baremeMax}</p>

        <table className="w-full text-sm border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden mb-4">
          <thead>
            <tr>
              <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">Élève</th>
              <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">Note</th>
              <th className="border-b border-champagne/10 px-3 py-2 text-left text-ivoire/60 font-medium">Absent</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr key={ligne.eleveId}>
                <td className="border-b border-champagne/5 px-3 py-2">
                  {ligne.nom} {ligne.prenom}
                </td>
                <td className="border-b border-champagne/5 px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    max={baremeMax}
                    step="0.5"
                    disabled={ligne.absent}
                    value={ligne.valeur ?? ""}
                    onChange={(e) => modifierValeur(ligne.eleveId, e.target.value)}
                    className="w-20 rounded-lg bg-obsidienne border border-champagne/15 px-2 py-1 focus:outline-none focus:border-champagne/40 disabled:opacity-40"
                  />
                </td>
                <td className="border-b border-champagne/5 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={ligne.absent}
                    onChange={() => basculerAbsent(ligne.eleveId)}
                    className="accent-champagne"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {message && <p className="text-sm mb-3 text-champagne">{message}</p>}

        <button
          onClick={enregistrer}
          disabled={enregistrement}
          className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer les notes"}
        </button>
      </main>
    </div>
  );
}
