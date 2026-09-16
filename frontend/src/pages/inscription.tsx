import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { inscrire, enregistrerSession, listerMatieres, connecterAvecGoogle } from "../lib/api";
import BoutonConnexionGoogle from "../components/BoutonConnexionGoogle";

const MATIERES_FALLBACK = [
  "Mathématiques",
  "Français",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Histoire-Géographie",
  "Philosophie",
  "Sciences de la Vie et de la Terre",
  "Physique-Chimie",
  "Éducation Physique et Sportive",
  "Économie",
  "EDHC",
];

export default function Inscription() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  // Initialisé tout de suite avec la liste de secours
  const [matieresDisponibles, setMatieresDisponibles] = useState<string[]>(MATIERES_FALLBACK);
  const [matiereChoisie, setMatiereChoisie] = useState(MATIERES_FALLBACK[0]);
  const [autreMatiere, setAutreMatiere] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    listerMatieres()
      .then((liste) => {
        if (liste && liste.length > 0) {
          setMatieresDisponibles(liste);
          setMatiereChoisie(liste[0]);
        }
        // Sinon on garde le fallback déjà en place
      })
      .catch(() => {
        // On garde le fallback
      });
  }, []);

  async function soumettreFormulaire(e: React.FormEvent) {
    e.preventDefault();
    const nomMatiere =
      matiereChoisie === "__autre__" ? autreMatiere.trim() : matiereChoisie;

    if (!nomMatiere) {
      setErreur("Choisis ou renseigne ta matière.");
      return;
    }

    setErreur(null);
    setChargement(true);
    try {
      const session = await inscrire(nom, prenom, email, motDePasse, nomMatiere);
      enregistrerSession(session);
      router.push("/dashboard");
    } catch (err: any) {
      setErreur(err?.response?.data?.message || "Inscription impossible.");
    } finally {
      setChargement(false);
    }
  }

  async function gererCredentialGoogle(credential: string) {
    setErreur(null);
    try {
      const session = await connecterAvecGoogle(credential);
      enregistrerSession(session);
      router.push(session.enseignant?.matiere ? "/dashboard" : "/profil");
    } catch {
      setErreur("Inscription via Google impossible.");
    }
  }

  return (
    <main className="min-h-screen bg-obsidienne text-ivoire font-landing-sans flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-obsidienne-light border border-champagne/10 rounded-[2rem] p-8">
        <p className="font-landing italic text-xl text-center mb-1">MoyennePro</p>
        <h1 className="text-center text-ivoire/60 text-sm mb-6">
          Créer un compte enseignant
        </h1>

        <div className="flex justify-center mb-4">
          <BoutonConnexionGoogle onCredential={gererCredentialGoogle} />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-champagne/10" />
          <span className="text-xs text-ivoire/30">ou</span>
          <div className="h-px flex-1 bg-champagne/10" />
        </div>

        <form onSubmit={soumettreFormulaire} className="space-y-3">
          <div className="flex gap-3">
            <input
              placeholder="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              className="w-1/2 rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            <input
              placeholder="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-1/2 rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
          </div>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />

          <input
            type="password"
            placeholder="Mot de passe (min. 8 caractères)"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />

          {/* Sélecteur de matière */}
          <select
            value={matiereChoisie}
            onChange={(e) => setMatiereChoisie(e.target.value)}
            required
            className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm text-ivoire focus:outline-none focus:border-champagne/40"
          >
            {matieresDisponibles.map((m) => (
              <option key={m} value={m} className="bg-obsidienne text-ivoire">
                {m}
              </option>
            ))}
            <option value="__autre__" className="bg-obsidienne text-ivoire">
              Autre (préciser)…
            </option>
          </select>

          {matiereChoisie === "__autre__" && (
            <input
              placeholder="Ta matière"
              value={autreMatiere}
              onChange={(e) => setAutreMatiere(e.target.value)}
              required
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
          )}

          {erreur && <p className="text-sm text-red-400">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-[1.25rem] bg-champagne text-obsidienne font-medium py-2.5 text-sm transition-all hover:scale-[1.01] disabled:opacity-60"
          >
            {chargement ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-xs text-ivoire/40 mt-5">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-champagne hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}