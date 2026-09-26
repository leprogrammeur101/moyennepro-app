import { z } from "zod";

/** Email basique + normalisation */
export const schemaEmail = z
  .string()
  .trim()
  .email("Email invalide.")
  .max(255);

/** Mot de passe : min 8, au moins une lettre et un chiffre */
export const schemaMotDePasse = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[a-zA-Z]/, "Le mot de passe doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

export const schemaInscription = z.object({
  nom: z.string().trim().min(1, "Le nom est requis.").max(100),
  prenom: z.string().trim().min(1, "Le prénom est requis.").max(100),
  email: schemaEmail,
  mot_de_passe: schemaMotDePasse,
  matiere: z.string().trim().max(100).optional(),
});

export const schemaConnexion = z.object({
  email: schemaEmail,
  mot_de_passe: z.string().min(1, "Mot de passe requis."),
});

export const schemaClasse = z.object({
  nom: z.string().trim().min(1, "Le nom de la classe est requis.").max(100),
  niveau: z.string().trim().min(1, "Le niveau est requis.").max(50),
  annee_scolaire: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Format année scolaire attendu : 2026-2027."),
});

export const schemaEleve = z.object({
  nom: z.string().trim().min(1, "Le nom est requis.").max(100),
  prenom: z.string().trim().min(1, "Le prénom est requis.").max(100),
  matricule: z.string().trim().max(50).optional(),
});

export const schemaDevoir = z.object({
  nom: z.string().trim().min(1, "Le nom du devoir est requis.").max(150),
  type: z.enum(["INTERROGATION", "DEVOIR"], {
    message: "Type de devoir invalide (INTERROGATION ou DEVOIR).",
  }),
  periodeId: z.string().uuid("Identifiant de période invalide."),
  date: z.string().min(1, "La date est requise."),
});

export const schemaNoteLigne = z.object({
  eleveId: z.string().uuid("Identifiant élève invalide."),
  valeur: z.number().min(0, "La note ne peut pas être négative."),
  absent: z.boolean(),
});

export const schemaEnregistrementNotes = z.object({
  notes: z
    .array(schemaNoteLigne)
    .min(1, "Au moins une note est requise."),
});

export const schemaPeriode = z.object({
  nom: z.string().trim().min(1, "Le nom de la période est requis.").max(100),
  annee_scolaire: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Format année scolaire attendu : 2026-2027."),
  date_debut: z.string().min(1, "Date de début requise."),
  date_fin: z.string().min(1, "Date de fin requise."),
});

export const schemaProfil = z.object({
  nom: z.string().trim().min(1).max(100).optional(),
  prenom: z.string().trim().min(1).max(100).optional(),
  matiere: z.string().trim().max(100).optional(),
});

export const schemaMatiere = z.object({
  nom: z.string().trim().min(1, "Nom de matière requis.").max(100),
});

export const schemaSouscription = z.object({
  plan: z.enum(["TRIMESTRIEL", "ANNUEL"], {
    message: "Plan invalide (TRIMESTRIEL ou ANNUEL).",
  }),
});

/**
 * Parse un body avec un schéma Zod.
 * En cas d'échec, lance une Error avec le premier message lisible.
 */
export function parserOuErreur<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const resultat = schema.safeParse(data);
  if (!resultat.success) {
    const premier = resultat.error.issues[0];
    throw new Error(premier?.message || "Données invalides.");
  }
  return resultat.data;
}
