// frontend/src/components/ModaleUpgrade.tsx
import Link from "next/link";

interface Props {
    ouvert: boolean;
    onFermer: () => void;
    message?: string;
}

export default function ModaleUpgrade({ ouvert, onFermer, message }: Props) {
    if (!ouvert) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onFermer}
            />

            {/* Modale */}
            <div className="relative w-full max-w-md rounded-2xl border border-champagne/20 bg-obsidienne-light p-6 shadow-2xl">
                <button
                    onClick={onFermer}
                    className="absolute top-4 right-4 text-ivoire/40 hover:text-ivoire text-xl"
                >
                    ×
                </button>

                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-champagne/15 border border-champagne/30 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✦</span>
                    </div>
                    <h2 className="font-landing italic text-2xl mb-2">
                        Passez au niveau supérieur
                    </h2>
                    <p className="text-sm text-ivoire/60">
                        {message ||
                            "Vous avez atteint la limite du plan Gratuit (2 classes)."}
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="rounded-xl border border-champagne/15 bg-obsidienne p-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Trimestriel</span>
                            <span className="text-champagne font-semibold">1 500 FCFA</span>
                        </div>
                        <p className="text-xs text-ivoire/50">
                            Classes illimitées · Exports illimités · 90 jours
                        </p>
                    </div>

                    <div className="rounded-xl border border-champagne/30 bg-champagne/5 p-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Annuel</span>
                            <span className="text-champagne font-semibold">4 000 FCFA</span>
                        </div>
                        <p className="text-xs text-ivoire/50">
                            Meilleur rapport · Classes & exports illimités · 365 jours
                        </p>
                    </div>
                </div>

                <Link
                    href="/abonnement"
                    onClick={onFermer}
                    className="block w-full text-center rounded-xl bg-champagne text-obsidienne font-medium py-3 text-sm transition-all hover:scale-[1.02]"
                >
                    Voir les abonnements
                </Link>

                <button
                    onClick={onFermer}
                    className="w-full mt-3 text-sm text-ivoire/40 hover:text-ivoire/70"
                >
                    Plus tard
                </button>
            </div>
        </div>
    );
}