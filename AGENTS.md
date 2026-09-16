# MoyennePro – Rules pour l’agent

## Contexte produit
SaaS pour enseignants de collège/lycée en Côte d’Ivoire.
Objectif : saisie de notes par matière → calcul automatique moyenne + rang + export PDF + import Excel.
Paiement : CinetPay (Mobile Money).
Thème : "Luxe de Minuit" (obsidienne #0a0a0a, champagne #d4af37, ivoire #f5f0e6). Fonts : Playfair Display + Manrope.

## Stack
- Backend : Node.js + Express + TypeORM + PostgreSQL
- Frontend : Next.js (Pages Router) + Tailwind + TypeScript
- Auth : JWT + Google OAuth
- Paiement : CinetPay

## Règles strictes
- Toujours commencer par un Plan Artifact avant d’écrire du code
- Respecter strictement le thème Luxe de Minuit
- Un enseignant = une seule matière
- Notes /10 (interrogations) et /20 (devoirs) combinées en valeurs brutes (pas de conversion d’échelle)
- Rang masqué tant que la classe n’est pas complète
- Code production-ready uniquement (pas de placeholders)
- Toujours vérifier l’appartenance (enseignant → classe) sur les routes protégées
- Préférer les solutions simples et maintenables