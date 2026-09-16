import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { genererPdfResultats } from "./export.service";
import { PlanAbonnement } from "../../entities/Abonnement";
import { obtenirAbonnementActif, LIMITES_PLAN } from "../abonnements/abonnements.service";

export const exportRouter = Router();
exportRouter.use(exigerAuthentification);

exportRouter.get(
  "/classes/:classeId/periodes/:periodeId/export-pdf",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      const abonnement = await obtenirAbonnementActif(req.enseignantId!);

      // Pour l'instant on laisse passer (on ajoutera le compteur mensuel ensuite)
      // if (abonnement.plan === PlanAbonnement.GRATUIT) { ... }

      const pdfBuffer = await genererPdfResultats(
        req.enseignantId!,
        req.params.classeId,
        req.params.periodeId
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="resultats.pdf"');
      res.send(pdfBuffer);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
);
