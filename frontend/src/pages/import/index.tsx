import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  detecterColonnesExcel,
  confirmerImportExcel,
  listerClasses,
  ApercuColonnes,
  Classe,
  CibleImport,
} from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";

type Etape = "infos" | "apercu";
type ModeCible = "nouvelle" | "existante";

export default function ImportExcel() {
  useRequireAuth();
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("infos");

  // Cible de l'import : nouvelle classe ou classe existante
  const [mode, setMode] = useState<ModeCible>("nouvelle");
  const [classesExistantes, setClassesExistantes] = useState<Classe[]>([]);
  const [classeSelectionnee, setClasseSelectionnee] = useState("");

  // Infos de la nouvelle classe (si mode "nouvelle")
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("2026-2027");
  const [fichier, setFichier] = useState<File | null>(null);

  // Résultat de la détection + mapping manuel de secours
  const [apercu, setApercu] = useState<ApercuColonnes | null>(null);
  const [colonneNomChoisie, setColonneNomChoisie] = useState("");
  const [colonnePrenomChoisie, setColonnePrenomChoisie] = useState("");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    listerClasses().then((liste) => {
      setClassesExistantes(liste);
      if (liste.length > 0) {
        setClasseSelectionnee(liste[0].id);
      } else {
        setMode("nouvelle"); // pas de classe existante -> pas d'autre choix
      }
    });
  }, []);

  function construireCible(): CibleImport | null {
    if (mode === "existante") {
      if (!classeSelectionnee) return null;
      return { classeId: classeSelectionnee };
    }
    if (!nom || !niveau || !anneeScolaire) return null;
    return { donneesClasse: { nom, niveau, annee_scolaire: anneeScolaire } };
  }

  async function analyserFichier(e: React.FormEvent) {
    e.preventDefault();
    if (!fichier) {
      setErreur("Sélectionne un fichier Excel.");
      return;
    }
    if (!construireCible()) {
      setErreur("Choisis une classe existante ou renseigne les infos de la nouvelle classe.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const resultat = await detecterColonnesExcel(fichier);
      setApercu(resultat);
      setColonneNomChoisie(resultat.colonneNom ?? "");
      setColonnePrenomChoisie(resultat.colonnePrenom ?? "");
      setEtape("apercu");
    } catch {
      setErreur("Impossible d'analyser le fichier. Vérifie qu'il s'agit bien d'un .xlsx.");
    } finally {
      setChargement(false);
    }
  }

  async function confirmerImport() {
    const cible = construireCible();
    if (!fichier || !colonneNomChoisie || !colonnePrenomChoisie || !cible) {
      setErreur("Sélectionne les colonnes Nom et Prénom avant de confirmer.");
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const resultat = await confirmerImportExcel(fichier, colonneNomChoisie, colonnePrenomChoisie, cible);
      router.push(`/classes/${resultat.classe.id}`);
    } catch (err: any) {
      setErreur(err?.response?.data?.message || "Échec de l'import.");
    } finally {
      setChargement(false);
    }
  }

  const detectionReussie = apercu?.colonneNom && apercu?.colonnePrenom;

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="font-landing italic text-2xl mb-4">Importer des élèves depuis Excel</h1>

        {etape === "infos" && (
          <form
            onSubmit={analyserFichier}
            className="space-y-4 bg-obsidienne-light rounded-2xl border border-champagne/10 p-4"
          >
            {classesExistantes.length > 0 && (
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={mode === "existante"}
                    onChange={() => setMode("existante")}
                    className="accent-champagne"
                  />
                  Classe existante
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={mode === "nouvelle"}
                    onChange={() => setMode("nouvelle")}
                    className="accent-champagne"
                  />
                  Nouvelle classe
                </label>
              </div>
            )}

            {mode === "existante" ? (
              <select
                value={classeSelectionnee}
                onChange={(e) => setClasseSelectionnee(e.target.value)}
                className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
              >
                {classesExistantes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.niveau}, {c.annee_scolaire})
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  placeholder="Nom de la classe (ex. 3ème A)"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <input
                  placeholder="Niveau (ex. 3ème)"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  required
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
                <input
                  placeholder="Année scolaire (ex. 2026-2027)"
                  value={anneeScolaire}
                  onChange={(e) => setAnneeScolaire(e.target.value)}
                  required
                  className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
                />
              </>
            )}

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              required
              className="block text-sm text-ivoire/70"
            />
            {erreur && <p className="text-sm text-red-400">{erreur}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
            >
              {chargement ? "Analyse…" : "Analyser le fichier"}
            </button>
          </form>
        )}

        {etape === "apercu" && apercu && (
          <div>
            {detectionReussie ? (
              <p className="text-sm text-ivoire/70 mb-3">
                Colonnes détectées : <strong>{apercu.colonneNom}</strong> (nom),{" "}
                <strong>{apercu.colonnePrenom}</strong> (prénom). Vérifie l'aperçu ci-dessous avant de confirmer.
              </p>
            ) : (
              <p className="text-sm text-champagne/80 mb-3">
                Détection automatique incertaine — sélectionne manuellement les colonnes correspondantes ci-dessous.
              </p>
            )}

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-ivoire/50 block mb-1">Colonne Nom</label>
                <select
                  value={colonneNomChoisie}
                  onChange={(e) => setColonneNomChoisie(e.target.value)}
                  className="w-full rounded-xl bg-obsidienne-light border border-champagne/15 px-2 py-1.5 text-sm focus:outline-none focus:border-champagne/40"
                >
                  <option value="">— Choisir —</option>
                  {apercu.colonnesDisponibles.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-ivoire/50 block mb-1">Colonne Prénom</label>
                <select
                  value={colonnePrenomChoisie}
                  onChange={(e) => setColonnePrenomChoisie(e.target.value)}
                  className="w-full rounded-xl bg-obsidienne-light border border-champagne/15 px-2 py-1.5 text-sm focus:outline-none focus:border-champagne/40"
                >
                  <option value="">— Choisir —</option>
                  {apercu.colonnesDisponibles.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <table className="w-full text-sm border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden mb-4">
              <thead>
                <tr>
                  {apercu.colonnesDisponibles.map((col) => (
                    <th
                      key={col}
                      className={`border-b border-champagne/10 px-2 py-1 text-left ${
                        col === colonneNomChoisie || col === colonnePrenomChoisie
                          ? "bg-champagne/15 text-champagne"
                          : "text-ivoire/60"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apercu.apercu.map((ligne) => (
                  <tr key={ligne.ligne}>
                    {apercu.colonnesDisponibles.map((col) => (
                      <td key={col} className="border-b border-champagne/5 px-2 py-1">
                        {ligne.valeurs[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {erreur && <p className="text-sm text-red-400 mb-3">{erreur}</p>}

            <div className="flex gap-2">
              <button
                onClick={confirmerImport}
                disabled={chargement}
                className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
              >
                {chargement ? "Import…" : "Confirmer l'import"}
              </button>
              <button
                onClick={() => setEtape("infos")}
                className="rounded-xl border border-champagne/20 px-4 py-2 text-sm"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
