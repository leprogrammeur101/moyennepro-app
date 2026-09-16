// frontend/src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "../lib/useAuth";
import Navbar from "../components/Navbar";
import { obtenirDashboard, DashboardData } from "../lib/api";
import { Skeleton, SkeletonCarte } from "../components/Skeleton";

export default function Dashboard() {
    useRequireAuth();

    const [data, setData] = useState<DashboardData | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);

    useEffect(() => {
        obtenirDashboard()
            .then(setData)
            .catch(() => setErreur("Impossible de charger le tableau de bord."))
            .finally(() => setChargement(false));
    }, []);

    if (chargement) {
        return (
            <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
                <Navbar />
                <main className="p-6 max-w-2xl mx-auto">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-40 mb-8" />

                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                    </div>

                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="space-y-3 mb-10">
                        <SkeletonCarte />
                        <SkeletonCarte />
                    </div>

                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-3">
                        <SkeletonCarte />
                        <SkeletonCarte />
                    </div>
                </main>
            </div>
        );
    }

    if (erreur || !data) {
        return (
            <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
                <Navbar />
                <main className="p-6 max-w-2xl mx-auto">
                    <p className="text-red-400">{erreur || "Erreur inconnue"}</p>
                </main>
            </div>
        );
    }

    const { resume, saisiesEnAttente, classes } = data;

    return (
        <div className="min-h-screen bg-obsidienne text-ivoire font-landing-sans">
            <Navbar />

            <main className="p-6 max-w-2xl mx-auto">
                {/* En-tête */}
                <div className="mb-8">
                    <h1 className="font-landing italic text-3xl mb-1">Tableau de bord</h1>
                    <p className="text-sm text-ivoire/50">{resume.periodeEnCours}</p>
                </div>

                {/* Résumé rapide */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 text-center">
                        <p className="text-2xl font-semibold text-champagne">
                            {resume.nombreClasses}
                        </p>
                        <p className="text-xs text-ivoire/50 mt-1">Classes</p>
                    </div>
                    <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 text-center">
                        <p className="text-2xl font-semibold text-champagne">
                            {resume.nombreEleves}
                        </p>
                        <p className="text-xs text-ivoire/50 mt-1">Élèves</p>
                    </div>
                    <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 text-center">
                        <p className="text-2xl font-semibold text-champagne">
                            {saisiesEnAttente.length}
                        </p>
                        <p className="text-xs text-ivoire/50 mt-1">Saisies en cours</p>
                    </div>
                </div>
                {resume.nombreClasses >= 2 && (
                    <div className="mb-6 rounded-xl border border-champagne/20 bg-champagne/5 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-ivoire/70">
                            Tu utilises {resume.nombreClasses}/2 classes gratuites
                        </p>
                        <Link
                            href="/abonnement"
                            className="text-sm text-champagne hover:underline font-medium"
                        >
                            Passer au plan payant →
                        </Link>
                    </div>
                )}
                {/* Saisies en attente */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-lg">Saisies en attente</h2>
                        {saisiesEnAttente.length > 0 && (
                            <span className="text-xs text-champagne bg-champagne/10 px-2.5 py-1 rounded-full">
                                {saisiesEnAttente.length} à terminer
                            </span>
                        )}
                    </div>

                    {saisiesEnAttente.length === 0 ? (
                        <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-6 text-center">
                            <p className="text-sm text-ivoire/50">
                                Aucune saisie en cours. Tout est à jour ✓
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {saisiesEnAttente.map((saisie) => {
                                const progression =
                                    saisie.totalEleves > 0
                                        ? Math.round(
                                            (saisie.notesSaisies / saisie.totalEleves) * 100
                                        )
                                        : 0;

                                return (
                                    <Link
                                        key={saisie.id}
                                        href={`/devoirs/${saisie.id}?classeId=${saisie.classeId}`}
                                        className="block rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 hover:border-champagne/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{saisie.nomDevoir}</p>
                                                <p className="text-sm text-ivoire/50">
                                                    {saisie.classeNom}
                                                </p>
                                            </div>
                                            <span className="text-xs text-ivoire/60 whitespace-nowrap ml-3">
                                                {saisie.notesSaisies}/{saisie.totalEleves}
                                            </span>
                                        </div>

                                        <div className="w-full h-1.5 bg-obsidienne rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-champagne transition-all duration-300"
                                                style={{ width: `${progression}%` }}
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Mes classes */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-lg">Mes classes</h2>
                    </div>

                    {classes.length === 0 ? (
                        <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-6 text-center mb-6">
                            <p className="text-sm text-ivoire/50 mb-3">
                                Aucune classe pour l’instant.
                            </p>
                            <Link
                                href="/classes"
                                className="text-sm text-champagne hover:underline"
                            >
                                Créer ma première classe →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {classes.map((classe) => (
                                <Link
                                    key={classe.id}
                                    href={`/classes/${classe.id}`}
                                    className="block rounded-2xl border border-champagne/10 bg-obsidienne-light p-4 hover:border-champagne/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium">{classe.nom}</p>
                                            <p className="text-sm text-ivoire/50">
                                                {classe.niveau} · {classe.nombreEleves} élèves
                                            </p>
                                        </div>
                                        <span className="text-sm text-champagne font-medium">
                                            {classe.completude}%
                                        </span>
                                    </div>

                                    <div className="w-full h-1.5 bg-obsidienne rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-champagne/80 transition-all duration-300"
                                            style={{ width: `${classe.completude}%` }}
                                        />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Link
                            href="/classes"
                            className="flex-1 text-center rounded-xl bg-champagne text-obsidienne font-medium px-4 py-2.5 text-sm transition-all hover:scale-[1.02]"
                        >
                            Gérer mes classes
                        </Link>
                        <Link
                            href="/import"
                            className="flex-1 text-center rounded-xl border border-champagne/20 px-4 py-2.5 text-sm hover:border-champagne/40 transition-colors"
                        >
                            Importer Excel
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}