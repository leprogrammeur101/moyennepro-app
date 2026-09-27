import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM || "MoyennePro <onboarding@resend.dev>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

/**
 * Envoie l'email de réinitialisation de mot de passe.
 * En dev sans RESEND_API_KEY : log le lien dans la console (pratique pour tester).
 */
export async function envoyerEmailReinitialisation(
  email: string,
  prenom: string,
  token: string
): Promise<void> {
  const lien = `${FRONTEND_URL}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;

  const resend = getClient();

  if (!resend) {
    console.log(
      "[email] RESEND_API_KEY absent — lien de réinitialisation (dev) :",
      lien
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Réinitialisation de votre mot de passe — MoyennePro",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 18px; font-style: italic;">MoyennePro</p>
        <p>Bonjour ${prenom || ""},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous (valable 1 heure) :</p>
        <p style="margin: 28px 0;">
          <a href="${lien}"
             style="display: inline-block; background: #C9A84C; color: #0D0D12; text-decoration: none; padding: 12px 24px; border-radius: 999px; font-weight: 600;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="font-size: 13px; color: #666;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        <p style="font-size: 12px; color: #999; margin-top: 32px;">MoyennePro — pour les enseignants ivoiriens</p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Erreur Resend :", error);
    throw new Error("Impossible d'envoyer l'email de réinitialisation.");
  }
}
