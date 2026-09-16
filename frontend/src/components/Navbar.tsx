import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { deconnecter, obtenirEnseignantLocal, EnseignantLocal } from "../lib/useAuth";

const ONGLETS = [
  { href: "/classes", label: "Mes classes" },
  { href: "/import", label: "Importer" },
];

function initiales(prenom?: string, nom?: string): string {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function Navbar() {
  const router = useRouter();
  const [enseignant, setEnseignant] = useState<EnseignantLocal | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lu après montage seulement : localStorage n'existe pas côté serveur,
    // le faire dans le corps du composant provoquerait un mismatch d'hydratation.
    setEnseignant(obtenirEnseignantLocal());
  }, [router.pathname]);

  useEffect(() => {
    function fermerSiExterieur(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOuvert(false);
      }
    }
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  function estActif(href: string) {
    return router.pathname === href;
  }

  function gererDeconnexion() {
    deconnecter();
    router.push("/");
  }

  return (
    <nav className="bg-obsidienne text-ivoire sticky top-0 z-20 border-b border-champagne/10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/classes" className="font-landing italic text-lg tracking-wide shrink-0">
          MoyennePro
        </Link>

        {/* Onglets — desktop */}
        <div className="hidden sm:flex items-end h-full ml-8 mr-auto gap-1">
          {ONGLETS.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              className={`px-3 py-2 text-sm rounded-t-md border-b-2 transition-colors ${
                estActif(onglet.href)
                  ? "border-champagne text-ivoire bg-obsidienne-light"
                  : "border-transparent text-ivoire/60 hover:text-ivoire hover:bg-obsidienne-light/60"
              }`}
            >
              {onglet.label}
            </Link>
          ))}
        </div>

        {/* Menu compte — desktop */}
        <div className="hidden sm:block relative" ref={menuRef}>
          <button
            onClick={() => setMenuOuvert((v) => !v)}
            className="w-9 h-9 rounded-full bg-champagne text-obsidienne font-semibold text-sm flex items-center justify-center hover:bg-champagne-dark transition-colors"
            aria-label="Menu du compte"
          >
            {initiales(enseignant?.prenom, enseignant?.nom)}
          </button>

          {menuOuvert && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-obsidienne-light text-ivoire shadow-lg border border-champagne/15 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-champagne/10">
                <p className="text-sm font-medium">
                  {enseignant?.prenom} {enseignant?.nom}
                </p>
                <p className="text-xs text-ivoire/50">
                  {enseignant?.matiere || "Matière non renseignée"}
                </p>
              </div>
              <Link
                href="/profil"
                className="block px-4 py-2 text-sm hover:bg-champagne/10"
                onClick={() => setMenuOuvert(false)}
              >
                Mon profil
              </Link>
              <Link
                href="/abonnement"
                className="block px-4 py-2 text-sm hover:bg-champagne/10"
                onClick={() => setMenuOuvert(false)}
              >
                Mon abonnement
              </Link>
              <button
                onClick={gererDeconnexion}
                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* Bouton hamburger — mobile */}
        <button
          onClick={() => setMenuMobileOuvert((v) => !v)}
          className="sm:hidden w-9 h-9 flex items-center justify-center"
          aria-label="Menu"
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
            <path d="M0 1H20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 7H20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M0 13H20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Panneau — mobile */}
      {menuMobileOuvert && (
        <div className="sm:hidden bg-obsidienne-light px-4 py-3 space-y-1">
          <div className="px-1 pb-2 mb-1 border-b border-champagne/10">
            <p className="text-sm font-medium">
              {enseignant?.prenom} {enseignant?.nom}
            </p>
            <p className="text-xs text-ivoire/50">{enseignant?.matiere || "Matière non renseignée"}</p>
          </div>
          {ONGLETS.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              onClick={() => setMenuMobileOuvert(false)}
              className={`block px-2 py-2 rounded text-sm ${
                estActif(onglet.href) ? "bg-obsidienne text-ivoire" : "text-ivoire/80"
              }`}
            >
              {onglet.label}
            </Link>
          ))}
          <Link
            href="/profil"
            onClick={() => setMenuMobileOuvert(false)}
            className="block px-2 py-2 rounded text-sm text-ivoire/80"
          >
            Mon profil
          </Link>
          <Link
            href="/abonnement"
            onClick={() => setMenuMobileOuvert(false)}
            className="block px-2 py-2 rounded text-sm text-ivoire/80"
          >
            Mon abonnement
          </Link>
          <button
            onClick={gererDeconnexion}
            className="block w-full text-left px-2 py-2 rounded text-sm text-red-400"
          >
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
}
