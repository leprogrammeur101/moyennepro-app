import Link from "next/link";
import { useRouter } from "next/router";
import { deconnecter } from "../lib/useAuth";

export default function EnTeteApp() {
  const router = useRouter();

  function gererDeconnexion() {
    deconnecter();
    router.push("/");
  }

  return (
    <div className="flex items-center justify-between mb-4 text-sm">
      <Link href="/classes" className="font-medium text-emerald-800">
        MoyennePro
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/abonnement" className="text-emerald-700">
          Mon abonnement
        </Link>
        <button onClick={gererDeconnexion} className="text-gray-500">
          Déconnexion
        </button>
      </div>
    </div>
  );
}
