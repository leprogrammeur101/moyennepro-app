import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { obtenirProfil, mettreAJourProfil, listerMatieres, Profil } from "../lib/api";
import { useRequireAuth, mettreAJourEnseignantLocal } from "../lib/useAuth";
import Navbar from "../components/Navbar";

export default function PageProfil() {
  useRequireAuth();
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [matieresDisponibles, setMatieresDisponibles] = useState<string[]>([]);
  const [matiereChoisie, setMatiereChoisie] = useState("");
  const [autreMatiere, setAutreMatiere] = useState("");
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    Promise.all([obtenirProfil(), listerMatieres()]).then(([p, matieres]) => {
      setProfil(p);
      setNom(p.nom);
      setPrenom(p.prenom);
      setMatieresDisponibles(matieres);
      setMatiereChoisie(p.matiere && matieres.includes(p.matiere) ? p.matiere : matieres[0] ?? "");
      setChargement(false);
    });
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const nomMatiere = matiereChoisie === "__autre__" ? autreMatiere : matiereChoisie;
    if (!nomMatiere.trim()) {
      setErreur("Choisis ou renseigne une matière.");
      return;
    }
    setErreur(null);
    setConfirmation(false);
    setEnregistrement(true);
    try {
      const miseAJour = await mettreAJourProfil({ nom, prenom, matiere: nomMatiere });
      mettreAJourEnseignantLocal({ nom: miseAJour.nom, prenom: miseAJour.prenom, matiere: miseAJour.matiere });

      // Premier rattachement de matière (venant de /login) -> direction les classes.
      // Sinon on reste sur place avec une confirmation, l'enseignant est déjà en train de gérer son profil.
      if (!profil?.matiere) {
        router.push("/classes");
      } else {
        setProfil(miseAJour);
        setConfirmation(true);
      }
    } catch (err: any) {
      setErreur(err?.response?.data?.message || "Impossible d'enregistrer le profil.");
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
        <h1 className="font-landing italic text-2xl mb-1">Mon profil</h1>
        <p className="text-sm text-ivoire/50 mb-6">{profil?.email}</p>

        {!profil?.matiere && (
          <p className="text-sm text-champagne bg-champagne/10 border border-champagne/20 rounded-2xl p-3 mb-4">
            Il te reste à choisir ta matière avant de continuer — un enseignant n'en enseigne qu'une
            seule dans MoyennePro, ça détermine les classes que tu gères.
          </p>
        )}

        <form
          onSubmit={enregistrer}
          className="space-y-4 bg-obsidienne-light rounded-2xl border border-champagne/10 p-4"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-ivoire/60 block mb-1">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-ivoire/60 block mb-1">Nom</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-ivoire/60 block mb-1">Matière enseignée</label>
            <select
              value={matiereChoisie}
              onChange={(e) => setMatiereChoisie(e.target.value)}
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm focus:outline-none focus:border-champagne/40"
            >
              {matieresDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="__autre__">Autre (préciser)…</option>
            </select>
          </div>

          {matiereChoisie === "__autre__" && (
            <input
              placeholder="Nom de la matière"
              value={autreMatiere}
              onChange={(e) => setAutreMatiere(e.target.value)}
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
          )}

          {erreur && <p className="text-sm text-red-400">{erreur}</p>}
          {confirmation && <p className="text-sm text-champagne">Profil mis à jour.</p>}

          <button
            type="submit"
            disabled={enregistrement}
            className="rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2 text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </main>
    </div>
  );
}
