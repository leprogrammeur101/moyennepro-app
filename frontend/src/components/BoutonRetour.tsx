import Link from "next/link";

interface Props {
  href: string;
  label?: string;
  className?: string;
}

/**
 * Lien de retour visible et cohérent sur toutes les pages internes.
 */
export default function BoutonRetour({
  href,
  label = "Retour",
  className = "",
}: Props) {
  return (
    <Link
      href={href}
      className={`
        group inline-flex items-center gap-2 mb-5
        rounded-xl border border-champagne/20 bg-obsidienne-light/80
        px-3 py-2 text-sm text-ivoire/80
        transition-all duration-200
        hover:border-champagne/45 hover:bg-champagne/10 hover:text-champagne
        active:scale-[0.98]
        ${className}
      `}
    >
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-champagne/15 text-champagne text-sm transition-transform group-hover:-translate-x-0.5"
      >
        ←
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
