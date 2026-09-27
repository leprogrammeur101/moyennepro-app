import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { reinitialiserMotDePasse } from "../lib/api";

export default function ReinitialiserMotDePasse() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "";

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (!token) {
      setErreur("Lien invalide. Demande un nouveau lien de réinitialisation.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      await reinitialiserMotDePasse(token, motDePasse);
      setSucces(true);
    } catch (err: any) {
      setErreur(
        err?.response?.data?.message ||
          "Impossible de réinitialiser le mot de passe."
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="min-h-screen bg-obsidienne text-ivoire font-landing-sans flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-obsidienne-light border border-champagne/10 rounded-[2rem] p-8">
        <p className="font-landing italic text-xl text-center mb-1">MoyennePro</p>
        <h1 className="text-center text-ivoire/60 text-sm mb-6">
          Nouveau mot de passe
        </h1>

        {succes ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-ivoire/70 leading-relaxed">
              Mot de passe mis à jour. Tu peux te connecter.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-[1.25rem] bg-champagne text-obsidienne font-medium px-6 py-2.5 text-sm transition-all hover:scale-[1.01]"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <form onSubmit={soumettre} className="space-y-3">
            <input
              type="password"
              placeholder="Nouveau mot de passe (min. 8 car.)"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
            />
            {erreur && <p className="text-sm text-red-400">{erreur}</p>}
            <button
              type="submit"
              disabled={chargement || !token}
              className="w-full rounded-[1.25rem] bg-champagne text-obsidienne font-medium py-2.5 text-sm transition-all hover:scale-[1.01] disabled:opacity-60"
            >
              {chargement ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        )}

        {!succes && (
          <p className="text-center text-xs text-ivoire/40 mt-5">
            <Link
              href="/mot-de-passe-oublie"
              className="text-champagne hover:underline"
            >
              Demander un nouveau lien
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
