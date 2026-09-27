import { useState } from "react";
import Link from "next/link";
import { demanderReinitialisation } from "../lib/api";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await demanderReinitialisation(email);
      setEnvoye(true);
    } catch (err: any) {
      setErreur(
        err?.response?.data?.message || "Une erreur est survenue. Réessaie."
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
          Mot de passe oublié
        </h1>

        {envoye ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-ivoire/70 leading-relaxed">
              Si un compte existe avec cet email, un lien de réinitialisation a
              été envoyé. Vérifie ta boîte de réception (et les spams).
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-champagne hover:underline"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-ivoire/50 mb-5 leading-relaxed">
              Indique l'email de ton compte. Tu recevras un lien pour choisir un
              nouveau mot de passe.
            </p>
            <form onSubmit={soumettre} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-obsidienne border border-champagne/15 px-3 py-2.5 text-sm placeholder:text-ivoire/30 focus:outline-none focus:border-champagne/40"
              />
              {erreur && <p className="text-sm text-red-400">{erreur}</p>}
              <button
                type="submit"
                disabled={chargement}
                className="w-full rounded-[1.25rem] bg-champagne text-obsidienne font-medium py-2.5 text-sm transition-all hover:scale-[1.01] disabled:opacity-60"
              >
                {chargement ? "Envoi…" : "Envoyer le lien"}
              </button>
            </form>
            <p className="text-center text-xs text-ivoire/40 mt-5">
              <Link href="/login" className="text-champagne hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
