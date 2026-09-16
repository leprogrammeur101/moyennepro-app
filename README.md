# MoyennePro — squelette du projet

Application permettant aux enseignants de collège/lycée (système ivoirien) de saisir
les notes de leur matière et d'obtenir automatiquement la moyenne et le rang de
chaque élève. Voir le cahier des charges pour le détail fonctionnel complet.

## Structure

```
notes-moyenne-app/
├── backend/          # API Node.js (Express + TypeORM + PostgreSQL)
│   └── src/
│       ├── entities/       # Modèle de données (Enseignant, Classe, Note, etc.)
│       └── modules/
│           ├── notes/       # Calcul moyenne/rang (logique métier centrale)
│           └── import/      # Détection auto des colonnes Excel + import
└── frontend/         # PWA Next.js + Tailwind
    └── src/
        ├── pages/
        │   ├── index.tsx          # Landing page cinématographique (Luxe de Minuit, GSAP)
        │   ├── inscription.tsx    # Inscription (email/mdp + matière, ou Google)
        │   ├── login.tsx          # Connexion (email/mdp + Google)
        │   ├── profil.tsx         # Gestion du profil (nom, prénom, matière)
        │   ├── classes/           # Liste des classes (protégée)
        │   ├── import/            # Import Excel (nouvelle classe ou classe existante)
        │   └── notes/[classeId]   # Tableau moyennes/rangs
        ├── components/
        │   └── Navbar.tsx         # Navigation + menu compte (profil, abonnement, déconnexion)
        └── lib/
            ├── api.ts             # Client API
            └── useAuth.ts         # Garde d'authentification côté frontend
```

## Démarrage

### 1. Base de données

Créer une base PostgreSQL locale nommée `notes_moyenne` (ou ajuster `.env`).

### 2. Backend

```bash
cd backend
cp .env.example .env   # renseigner les identifiants de la base
npm install
npm run dev             # démarre sur http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # démarre sur http://localhost:3000
```

## Configuration CinetPay (paiement Mobile Money)

1. Créer un compte marchand sur [cinetpay.com](https://cinetpay.com) et récupérer `API Key` et `Site ID`
2. Renseigner `CINETPAY_API_KEY` et `CINETPAY_SITE_ID` dans `backend/.env`
3. `CINETPAY_NOTIFY_URL` doit pointer vers une URL **publique** de ton backend (ex. via ngrok en dev) — c'est cette URL que CinetPay appelle pour confirmer un paiement, elle ne peut donc pas être `localhost`
4. `CINETPAY_RETURN_URL` peut pointer vers `http://localhost:3000/abonnement` en dev

⚠️ Le webhook (`/api/paiements/webhook-cinetpay`) revérifie toujours le paiement auprès de CinetPay avant d'activer un abonnement — ne jamais activer un abonnement sur la seule base du retour navigateur (`return_url`), qui peut être falsifié.

## Configuration Google OAuth (connexion en un clic)

1. Créer un identifiant OAuth 2.0 de type "Application Web" dans Google Cloud Console
2. Ajouter `http://localhost:3000` aux origines JavaScript autorisées (en dev)
3. Renseigner le même `Client ID` dans `backend/.env` (`GOOGLE_CLIENT_ID`) et `frontend/.env` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`)

## État d'avancement

- [x] Schéma de données (voir `backend/src/entities/`)
- [x] Service de calcul moyenne/rang avec règle "note manquante = 0, coefficient inclus"
- [x] Rang masqué tant que la classe n'est pas à 100% de complétude, calculé à la volée
- [x] Détection automatique des colonnes Excel (Nom/Prénom) avec aperçu de confirmation
- [x] Authentification (email/mot de passe + connexion Google en un clic), route des résultats protégée par JWT
- [x] CRUD classes et élèves (scopé à l'enseignant connecté, avec vérification d'appartenance sur chaque opération)
- [x] Saisie des devoirs/interrogations et des notes (grille par devoir, validation du barème selon le type)
- [x] Flow d'import Excel complet (détection auto + aperçu + mapping manuel de secours + import dans une classe existante ou création d'une nouvelle)
- [x] Landing page cinématographique (thème "Luxe de Minuit", GSAP ScrollTrigger, protocole en scroll sticky) + inscription complète (email/mdp + matière, ou Google), routes protégées côté frontend
- [x] Export PDF des résultats (PDFKit, en-tête classe/période/matière, avertissement si classe incomplète)
- [x] Intégration paiement Mobile Money (CinetPay) et gestion des abonnements (gratuit / trimestriel / annuel)
- [x] Rattachement Enseignant ↔ Matière (choix à l'inscription ou via /profil, forcé après connexion si absent — notamment pour les comptes créés via Google)
- [x] Toute l'application (pas seulement la landing) harmonisée sur le thème "Luxe de Minuit" — obsidienne/champagne/ivoire, Playfair Display + Manrope

## Notes techniques

- Un enseignant enseigne une seule matière (relation 1-1 `Enseignant ↔ Matiere`).
- Le barème n'est pas fixé au niveau de la classe : chaque **devoir** a un `type` (`INTERROGATION` ou `DEVOIR`) qui détermine automatiquement son barème (/10 ou /20) et son coefficient (0,5 ou 1). Une classe peut donc mélanger interrogations et devoirs sur une même période.
- Les notes /10 (interrogations) et /20 (devoirs) sont combinées **avec leurs valeurs brutes**, sans conversion d'échelle, dans le calcul de moyenne (décision explicite de Soro).
- Le service worker (`frontend/public/sw.js`) ne fait que du cache de lecture en V1 ;
  la saisie hors-ligne avec synchronisation est une amélioration future à évaluer.
