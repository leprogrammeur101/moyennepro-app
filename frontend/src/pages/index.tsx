import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileSpreadsheet,
  Calculator,
  FileDown,
  ArrowRight,
  Check,
  Upload,
  PenLine,
  BarChart3,
} from "lucide-react";
import { estConnecte } from "../lib/useAuth";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const PLANS = [
  {
    nom: "Gratuit",
    prix: "0",
    unite: "pour toujours",
    avantages: ["1 classe", "Export limité", "Calcul moyenne et rang"],
    accent: false,
  },
  {
    nom: "Trimestriel",
    prix: "1 500",
    unite: "FCFA / trimestre",
    avantages: ["Jusqu'à 5 classes", "Export illimité", "Support prioritaire"],
    accent: true,
    badge: "Le plus choisi",
  },
  {
    nom: "Annuel",
    prix: "4 000",
    unite: "FCFA / an",
    avantages: ["Jusqu'à 5 classes", "Export illimité", "≈ 11% d'économie"],
    accent: false,
    badge: "Meilleur prix",
  },
];

const ETAPES = [
  {
    numero: "01",
    titre: "Importez",
    description:
      "Chargez la liste de vos élèves depuis un fichier Excel existant. Les colonnes nom et prénom sont détectées automatiquement.",
    Icone: Upload,
  },
  {
    numero: "02",
    titre: "Saisissez",
    description:
      "Interrogations sur 10, devoirs sur 20 — entrez vos notes au fil du trimestre, dans votre matière uniquement.",
    Icone: PenLine,
  },
  {
    numero: "03",
    titre: "Obtenez",
    description:
      "Moyenne pondérée et rang recalculés à chaque note, prêts à exporter en PDF pour le conseil de classe.",
    Icone: BarChart3,
  },
];

export default function Landing() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const heroTitreRef = useRef<HTMLHeadingElement>(null);
  const heroSousTitreRef = useRef<HTMLParagraphElement>(null);
  const heroCtaRef = useRef<HTMLDivElement>(null);
  const [etapeActive, setEtapeActive] = useState(0);

  useEffect(() => {
    if (estConnecte()) {
      router.replace("/classes");
    }
  }, [router]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [heroTitreRef.current, heroSousTitreRef.current, heroCtaRef.current],
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.15, delay: 0.15 }
      );

      ScrollTrigger.create({
        start: 40,
        end: 99999,
        onUpdate: (self) => {
          const scrolled = self.scroll() > 40;
          gsap.to(navRef.current, {
            maxWidth: scrolled ? 560 : 880,
            paddingTop: scrolled ? 10 : 16,
            paddingBottom: scrolled ? 10 : 16,
            backgroundColor: scrolled ? "rgba(13,13,18,0.9)" : "rgba(13,13,18,0.35)",
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        },
      });

      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((carte, i) => {
        gsap.fromTo(
          carte,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: i * 0.08,
            scrollTrigger: { trigger: carte, start: "top 85%" },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>(".philosophie-ligne").forEach((ligne) => {
        gsap.fromTo(
          ligne,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: ligne, start: "top 75%", end: "top 40%", scrub: true },
          }
        );
      });

      [0, 1, 2].forEach((i) => {
        ScrollTrigger.create({
          trigger: `#etape-${i}`,
          start: "top center",
          end: "bottom center",
          onEnter: () => setEtapeActive(i),
          onEnterBack: () => setEtapeActive(i),
        });
      });

      gsap.fromTo(
        ".plan-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".plans-grid", start: "top 82%" },
        }
      );

      gsap.fromTo(
        ".cta-finale",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".cta-finale", start: "top 85%" },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="bg-obsidienne text-ivoire font-landing-sans overflow-x-hidden">
      {/* Bruit de fond */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: "url('/noise.svg')" }}
        aria-hidden="true"
      />

      {/* NAVBAR — île flottante */}
      <div
        ref={navRef}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] rounded-full border border-champagne/15 backdrop-blur-md flex items-center justify-between px-6 py-4"
        style={{ maxWidth: 880, backgroundColor: "rgba(13,13,18,0.35)" }}
      >
        <span className="font-landing italic text-lg tracking-tight">MoyennePro</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-ivoire/70">
          <a href="#fonctionnalites" className="hover:text-ivoire transition-colors">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="hover:text-ivoire transition-colors">
            Tarifs
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ivoire/70 hover:text-ivoire transition-colors hidden sm:block">
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="bg-champagne text-obsidienne text-sm font-medium px-4 py-2 rounded-full transition-all hover:scale-[1.03] hover:-translate-y-px"
          >
            Commencer
          </Link>
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1600&auto=format&fit=crop')",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,13,18,0.4) 0%, rgba(13,13,18,0.85) 55%, #0D0D12 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl">
          <p className="uppercase tracking-[0.25em] text-xs text-champagne/80 mb-6">
            Collège &amp; lycée — Côte d'Ivoire
          </p>
          <h1 ref={heroTitreRef}>
            <span className="block font-landing-sans font-medium text-2xl md:text-3xl text-ivoire/85 mb-1">
              Vos notes
            </span>
            <span className="block font-landing italic text-5xl md:text-7xl leading-[1.05]">
              méritent mieux
              <br />
              qu'un tableur.
            </span>
          </h1>
          <p ref={heroSousTitreRef} className="mt-8 text-ivoire/60 text-base md:text-lg max-w-xl mx-auto">
            Importez votre classe, saisissez vos notes, MoyennePro calcule la moyenne pondérée
            et le rang de chaque élève — dans votre matière, sans formule à refaire chaque trimestre.
          </p>
          <div ref={heroCtaRef} className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="group bg-champagne text-obsidienne font-medium px-7 py-3.5 rounded-[2rem] flex items-center gap-2 transition-all hover:scale-[1.03] hover:-translate-y-px"
            >
              Commencer gratuitement
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="text-ivoire/70 hover:text-ivoire text-sm font-medium transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="fonctionnalites" className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <p className="uppercase tracking-[0.2em] text-xs text-champagne/70 mb-3">L'essentiel</p>
        <h2 className="font-landing italic text-3xl md:text-4xl mb-14 max-w-lg">
          Trois gestes, tout le trimestre.
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="feature-card bg-obsidienne-light border border-champagne/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.03] hover:-translate-y-1">
            <FileSpreadsheet size={28} className="text-champagne mb-6" />
            <p className="font-landing italic text-xl mb-3">Import Excel</p>
            <p className="text-sm text-ivoire/55 leading-relaxed">
              La liste de vos élèves, colonnes reconnues automatiquement, sans mise en forme à refaire.
            </p>
          </div>
          <div className="feature-card bg-obsidienne-light border border-champagne/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.03] hover:-translate-y-1">
            <Calculator size={28} className="text-champagne mb-6" />
            <p className="font-landing italic text-xl mb-3">Calcul automatique</p>
            <p className="text-sm text-ivoire/55 leading-relaxed">
              Interrogations sur 10, devoirs sur 20 — moyenne et rang recalculés à chaque note saisie.
            </p>
          </div>
          <div className="feature-card bg-obsidienne-light border border-champagne/10 rounded-[2.5rem] p-8 transition-all hover:scale-[1.03] hover:-translate-y-1">
            <FileDown size={28} className="text-champagne mb-6" />
            <p className="font-landing italic text-xl mb-3">Export PDF</p>
            <p className="text-sm text-ivoire/55 leading-relaxed">
              Un tableau propre à imprimer ou partager, prêt pour le conseil de classe.
            </p>
          </div>
        </div>
      </section>

      {/* PHILOSOPHIE */}
      <section className="relative z-10 bg-black py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="philosophie-ligne uppercase tracking-[0.25em] text-xs text-champagne/70 mb-10">
            Notre conviction
          </p>
          <p className="philosophie-ligne font-landing italic text-3xl md:text-5xl leading-[1.3] mb-6">
            Un enseignant devrait passer son temps à enseigner.
          </p>
          <p className="philosophie-ligne font-landing italic text-3xl md:text-5xl leading-[1.3] mb-6 text-ivoire/50">
            Pas à recompter des moyennes à la main.
          </p>
          <p className="philosophie-ligne font-landing italic text-3xl md:text-5xl leading-[1.3] text-champagne">
            MoyennePro s'occupe du calcul. Vous, du reste.
          </p>
        </div>
      </section>

      {/* PROTOCOLE — sticky scroll */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <p className="uppercase tracking-[0.2em] text-xs text-champagne/70 mb-3">Le protocole</p>
        <h2 className="font-landing italic text-3xl md:text-4xl mb-16 max-w-lg">
          De la liste d'élèves au bulletin.
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {ETAPES.map((etape, i) => (
              <div key={etape.numero} id={`etape-${i}`} className="min-h-[70vh] flex flex-col justify-center">
                <span className="text-champagne/50 font-landing italic text-sm mb-3">{etape.numero}</span>
                <h3 className="font-landing italic text-3xl mb-4">{etape.titre}</h3>
                <p className="text-ivoire/55 max-w-sm leading-relaxed">{etape.description}</p>
              </div>
            ))}
          </div>

          <div className="hidden md:block sticky top-1/4 h-fit">
            <div className="bg-obsidienne-light border border-champagne/15 rounded-[2.5rem] p-10 aspect-square flex flex-col items-center justify-center text-center transition-colors duration-500">
              {ETAPES.map((etape, i) => {
                const Icone = etape.Icone;
                return (
                  <div key={etape.numero} className={i === etapeActive ? "block" : "hidden"}>
                    <Icone size={40} className="text-champagne mx-auto mb-6" />
                    <p className="font-landing italic text-2xl mb-2">{etape.titre}</p>
                    <p className="text-xs text-ivoire/40 uppercase tracking-[0.2em]">
                      Étape {etape.numero}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* TARIFICATION */}
      <section id="tarifs" className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <p className="uppercase tracking-[0.2em] text-xs text-champagne/70 mb-3">Tarification</p>
        <h2 className="font-landing italic text-3xl md:text-4xl mb-14 max-w-lg">
          Un prix pensé pour le rythme scolaire.
        </h2>

        <div className="plans-grid grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.nom}
              className={`plan-card rounded-[2.5rem] p-8 border transition-all hover:scale-[1.03] hover:-translate-y-1 ${
                plan.accent
                  ? "bg-champagne text-obsidienne border-champagne"
                  : "bg-obsidienne-light border-champagne/10"
              }`}
            >
              {plan.badge && (
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-5 ${
                    plan.accent ? "bg-obsidienne text-champagne" : "bg-champagne/15 text-champagne"
                  }`}
                >
                  {plan.badge}
                </span>
              )}
              <p className="font-landing italic text-xl mb-1">{plan.nom}</p>
              <p className="mb-6">
                <span className="text-3xl font-medium">{plan.prix}</span>{" "}
                <span className={`text-sm ${plan.accent ? "text-obsidienne/70" : "text-ivoire/50"}`}>
                  {plan.unite}
                </span>
              </p>
              <ul className="space-y-2.5 mb-8">
                {plan.avantages.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <Check size={15} className={plan.accent ? "text-obsidienne" : "text-champagne"} />
                    {a}
                  </li>
                ))}
              </ul>
              <Link
                href="/inscription"
                className={`block text-center rounded-[2rem] py-3 text-sm font-medium transition-all hover:scale-[1.02] ${
                  plan.accent
                    ? "bg-obsidienne text-champagne"
                    : "bg-champagne/10 text-champagne border border-champagne/20"
                }`}
              >
                Choisir {plan.nom.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="cta-finale relative z-10 max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="font-landing italic text-4xl md:text-5xl mb-8">Prêt à corriger autrement ?</h2>
        <Link
          href="/inscription"
          className="inline-flex items-center gap-2 bg-champagne text-obsidienne font-medium px-8 py-4 rounded-[2rem] transition-all hover:scale-[1.03] hover:-translate-y-px"
        >
          Commencer gratuitement
          <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="relative z-10 border-t border-champagne/10 py-10 px-6 text-center">
        <p className="font-landing italic text-sm text-ivoire/50">MoyennePro</p>
        <p className="text-xs text-ivoire/30 mt-2">© 2026 — Fait pour les enseignants ivoiriens.</p>
      </footer>
    </div>
  );
}
