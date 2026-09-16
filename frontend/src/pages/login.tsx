import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  connecter,
  connecterAvecGoogle,
  enregistrerSession,
} from "../lib/api";
import BoutonConnexionGoogle from "../components/BoutonConnexionGoogle";

export default function Connexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettreFormulaire(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const session = await connecter(email, motDePasse);
      enregistrerSession(session);
      router.push(session.enseignant.matiere ? "/classes" : "/profil");
    } catch (err: any) {
      setErreur(err?.response?.data?.message || "Connexion impossible.");
    } finally {
      setChargement(false);
    }
  }

  async function gererCredentialGoogle(credential: string) {
    setErreur(null);
    try {
      const session = await connecterAvecGoogle(credential);
      enregistrerSession(session);
      router.push(session.enseignant.matiere ? "/classes" : "/profil");
    } catch {
      setErreur("Connexion Google impossible.");
    }
  }

  return (
    <main className="min-h-screen bg-obsidienne text-ivoire font-landing-sans flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-obsidienne-light border border-champagne/10 rounded-[2rem] p-8">
        <p className="font-landing italic text-xl text-center mb-1">MoyennePro</p>
        <h1 className="text-center text-ivoire/60 text-sm mb-6">Connexion</h1>

        <div className="flex justify-center mb-4">
          <BoutonConnexionGoogle onCredential={gererCredentialGoogle} />
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-champagne/10" />
          <span className="text-xs text-ivoire/30">ou</span>
          <div className="h-px flex-1 bg-champagne/10" />
        </div>

        <form onSubmit={soumettreFormulaire} className="space-y-3">
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
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
          />
          {erreur && <p className="text-sm text-red-400">{erreur}</p>}
          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-[1.25rem] bg-champagne text-obsidienne font-medium py-2.5 text-sm transition-all hover:scale-[1.01] disabled:opacity-60"
          >
            {chargement ? "Connexion…" : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-xs text-ivoire/40 mt-5">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-champagne hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
