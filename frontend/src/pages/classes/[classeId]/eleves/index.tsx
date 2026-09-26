import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listerEleves,
  ajouterEleve,
  supprimerEleve,
  Eleve,
} from "../../../../lib/api";
import { useRequireAuth } from "../../../../lib/useAuth";
import Navbar from "../../../../components/Navbar";
import BoutonRetour from "../../../../components/BoutonRetour";
import { Skeleton } from "../../../../components/Skeleton";
import { useToast } from "../../../../components/Toast";

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ListeElevesClasse() {
  useRequireAuth();
  const router = useRouter();
  const { classeId } = router.query;

  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matricule, setMatricule] = useState("");
  const { showToast } = useToast();

  function charger() {
    if (!classeId) return;
    setChargement(true);
    listerEleves(classeId as string)
      .then(setEleves)
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    charger();
  }, [classeId]);

  const elevesFiltres = useMemo(() => {
    const q = normaliser(recherche.trim());
    if (!q) return eleves;
    return eleves.filter((e) => {
      const nomN = normaliser(e.nom);
      const prenomN = normaliser(e.prenom);
      const matN = normaliser(e.matricule || "");
      const complet = `${nomN} ${prenomN}`;
      const completInverse = `${prenomN} ${nomN}`;
      return (
        nomN.includes(q) ||
        prenomN.includes(q) ||
        matN.includes(q) ||
        complet.includes(q) ||
        completInverse.includes(q)
      );
    });
  }, [eleves, recherche]);

  async function soumettreNouvelEleve(e: React.FormEvent) {
    e.preventDefault();
    if (!classeId) return;
    try {
      await ajouterEleve(classeId as string, {
        nom,
        prenom,
        matricule: matricule.trim() || undefined,
      });
      setNom("");
      setPrenom("");
      setMatricule("");
      charger();
      showToast("Élève ajouté", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible d'ajouter l'élève",
        "error"
      );
    }
  }

  async function gererSuppression(eleveId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!classeId) return;
    if (!confirm("Supprimer cet élève et toutes ses notes ?")) return;
    try {
      await supprimerEleve(classeId as string, eleveId);
      charger();
      showToast("Élève supprimé", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de supprimer l'élève",
        "error"
      );
    }
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto w-full">
        <BoutonRetour
          href={`/classes/${classeId}`}
          label="Retour à la classe"
        />

        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h1 className="font-landing italic text-xl sm:text-2xl">Élèves</h1>
          {!chargement && (
            <span className="text-sm text-ivoire/50">
              {eleves.length} élève{eleves.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="relative mb-4">
          <input
            type="search"
            placeholder="Rechercher par nom, prénom ou matricule…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2.5 pl-9 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            autoComplete="off"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ivoire/40 text-sm pointer-events-none">
            ⌕
          </span>
        </div>

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
          <input
            placeholder="Matricule (optionnel)"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            className="w-full sm:flex-1 min-w-0 rounded-xl bg-obsidienne-light border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />
          <button
            type="submit"
            className="w-full sm:w-auto shrink-0 rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
          >
            Ajouter
          </button>
        </form>

        <p className="text-xs text-ivoire/40 mb-4">
          Ou{" "}
          <Link href="/import" className="underline text-champagne/80">
            importer depuis Excel
          </Link>
        </p>

        {chargement ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : eleves.length === 0 ? (
          <p className="text-sm text-ivoire/50 leading-relaxed">
            Aucun élève pour l'instant. Ajoute-les ci-dessus ou importe un
            fichier Excel.
          </p>
        ) : elevesFiltres.length === 0 ? (
          <p className="text-sm text-ivoire/50">
            Aucun élève ne correspond à « {recherche} ».
          </p>
        ) : (
          <ul className="space-y-2">
            {elevesFiltres.map((eleve) => (
              <li key={eleve.id}>
                <Link
                  href={`/classes/${classeId}/eleves/${eleve.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-champagne/10 bg-obsidienne-light px-3 py-3 hover:border-champagne/30 transition-colors"
                >
                  <span className="min-w-0 truncate">
                    <span className="text-sm font-medium">
                      {eleve.nom} {eleve.prenom}
                    </span>
                    {eleve.matricule && (
                      <span className="block text-xs text-ivoire/45 truncate">
                        {eleve.matricule}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => gererSuppression(eleve.id, e)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      Supprimer
                    </button>
                    <span className="text-champagne/60 text-sm">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
