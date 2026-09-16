import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { listerClasses, creerClasse, supprimerClasse, obtenirProfil, Classe } from "../../lib/api";
import { useRequireAuth } from "../../lib/useAuth";
import Navbar from "../../components/Navbar";

export default function ListeClasses() {
  useRequireAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<Classe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [anneeScolaire, setAnneeScolaire] = useState("2026-2027");

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
    await creerClasse({ nom, niveau, annee_scolaire: anneeScolaire });
    setNom("");
    setNiveau("");
    setAfficherFormulaire(false);
    chargerClasses();
  }

  async function gererSuppression(classeId: string) {
    if (!confirm("Supprimer cette classe et tous ses élèves ?")) return;
    await supprimerClasse(classeId);
    chargerClasses();
  }

  return (
    <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
      <Navbar />
      <main className="p-6 max-w-xl mx-auto">
        <h1 className="font-landing italic text-2xl mb-5">Mes classes</h1>

        {chargement ? (
          <p className="text-sm text-ivoire/50">Chargement…</p>
        ) : classes.length === 0 ? (
          <p className="text-sm text-ivoire/50 mb-4">Aucune classe pour l'instant.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {classes.map((classe) => (
              <div
                key={classe.id}
                className="flex items-center justify-between rounded-2xl border border-champagne/10 bg-obsidienne-light p-4"
              >
                <Link href={`/classes/${classe.id}`} className="flex-1">
                  <p className="font-medium">{classe.nom}</p>
                  <p className="text-sm text-ivoire/50">
                    {classe.niveau} · {classe.annee_scolaire}
                  </p>
                </Link>
                <button
                  onClick={() => gererSuppression(classe.id)}
                  className="text-sm text-red-400 ml-3"
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
            className="space-y-3 bg-obsidienne-light rounded-2xl border border-champagne/10 p-4"
          >
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02]"
              >
                Créer la classe
              </button>
              <button
                type="button"
                onClick={() => setAfficherFormulaire(false)}
                className="rounded-xl border border-champagne/20 px-4 py-2 text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setAfficherFormulaire(true)}
              className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02]"
            >
              Créer une classe
            </button>
            <Link
              href="/import"
              className="rounded-xl border border-champagne/20 px-4 py-2 text-sm"
            >
              Importer depuis Excel
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
