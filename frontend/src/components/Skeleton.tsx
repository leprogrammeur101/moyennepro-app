// frontend/src/components/Skeleton.tsx

interface SkeletonProps {
    className?: string;
}

/** Bloc de base avec animation pulse */
export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-champagne/10 ${className}`}
        />
    );
}

/** Skeleton pour une carte de classe */
export function SkeletonCarte() {
    return (
        <div className="rounded-2xl border border-champagne/10 bg-obsidienne-light p-4">
            <Skeleton className="h-5 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

/** Skeleton pour le tableau de saisie des notes */
export function SkeletonTableau({ rows = 8 }: { rows?: number }) {
    return (
        <div className="w-full border border-champagne/10 bg-obsidienne-light rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-champagne/10 px-3 py-3 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
            </div>

            {/* Lignes */}
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center border-b border-champagne/5 px-3 py-3 gap-4"
                >
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-4 w-4 rounded" />
                </div>
            ))}
        </div>
    );
}

/** Skeleton texte simple (plusieurs lignes) */
export function SkeletonTexte({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
                />
            ))}
        </div>
    );
}