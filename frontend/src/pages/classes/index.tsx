import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  listerClasses,
  creerClasse,
  supprimerClasse,
  obtenirProfil,
  Classe,
} from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";
import { SkeletonCarte } from "../../components/Skeleton";
import ModaleUpgrade from "../../components/ModaleUpgrade";
import { useToast } from "../../components/Toast";

export default function ListeClasses() {
  useRequireAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<Classe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("2026-2027");
  const [modaleUpgradeOuverte, setModaleUpgradeOuverte] = useState(false);
  const [messageLimite, setMessageLimite] = useState("");
  const { showToast } = useToast();

  function chargerClasses() {
    setChargement(true);
    listerClasses()
      .then(setClasses)
      .finally(() => setChargement(false));
  }

  useEffect(() => {
    obtenirProfil().then((profil) => {
      if (!profil.matiere) router.replace("/profil");
    });
    chargerClasses();
  }, []);

  async function soumettreNouvelleClasse(e: React.FormEvent) {
    e.preventDefault();
    try {
      await creerClasse({ nom, niveau, annee_scolaire: anneeScolaire });
      setNom("");
      setNiveau("");
      setAfficherFormulaire(false);
      chargerClasses();
      showToast("Classe créée", "success");
    } catch (err: any) {
      if (
        err?.response?.status === 403 ||
        err?.response?.data?.code === "LIMITE_CLASSES"
      ) {
        setMessageLimite(
          err?.response?.data?.message ||
            "Limite atteinte : le plan Gratuit est limité à 2 classes."
        );
        setModaleUpgradeOuverte(true);
      } else {
        showToast(
          err?.response?.data?.message || "Erreur lors de la création",
          "error"
        );
      }
    }
  }

  async function gererSuppression(classeId: string) {
    if (!confirm("Supprimer cette classe et tous ses élèves ?")) return;
    try {
      await supprimerClasse(classeId);
      chargerClasses();
      showToast("Classe supprimée", "success");
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Impossible de supprimer la classe",
        "error"
      );
    }
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      <Navbar />
      <main className="px-4 py-5 sm:p-6 max-w-xl mx-auto w-full">
        <h1 className="font-landing italic text-xl sm:text-2xl mb-5">
          Mes classes
        </h1>

        {chargement ? (
          <div className="space-y-3 mb-4">
            <SkeletonCarte />
            <SkeletonCarte />
            <SkeletonCarte />
          </div>
        ) : classes.length === 0 ? (
          <p className="text-sm text-ivoire/50 mb-4">
            Aucune classe pour l'instant.
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {classes.map((classe) => (
              <div
                key={classe.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-champagne/10 bg-obsidienne-light p-3 sm:p-4"
              >
                <Link
                  href={`/classes/${classe.id}`}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium truncate">{classe.nom}</p>
                  <p className="text-sm text-ivoire/50">
                    {classe.niveau} · {classe.annee_scolaire}
                  </p>
                </Link>
                <button
                  onClick={() => gererSuppression(classe.id)}
                  className="shrink-0 text-sm text-red-400 hover:text-red-300 px-1 py-1"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        {afficherFormulaire ? (
          <form
            onSubmit={soumettreNouvelleClasse}
            className="space-y-3 bg-obsidienne-light rounded-2xl border border-champagne/10 p-3 sm:p-4"
          >
            <input
              placeholder="Nom de la classe (ex. 3ème A)"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            <input
              placeholder="Niveau (ex. 3ème)"
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              required
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            <input
              placeholder="Année scolaire (ex. 2026-2027)"
              value={anneeScolaire}
              onChange={(e) => setAnneeScolaire(e.target.value)}
              required
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
              >
                Créer la classe
              </button>
              <button
                type="button"
                onClick={() => setAfficherFormulaire(false)}
                className="w-full sm:w-auto rounded-xl border border-champagne/20 px-4 py-2.5 text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setAfficherFormulaire(true)}
              className="w-full sm:w-auto rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
            >
              Créer une classe
            </button>
            <Link
              href="/import"
              className="w-full sm:w-auto text-center rounded-xl border border-champagne/20 px-4 py-2.5 text-sm hover:border-champagne/40 transition-colors"
            >
              Importer depuis Excel
            </Link>
          </div>
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
