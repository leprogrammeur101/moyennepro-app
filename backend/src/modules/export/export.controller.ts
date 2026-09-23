import { Router, Response } from "express";
import { exigerAuthentification, RequeteAuthentifiee } from "../auth/auth.middleware";
import { genererPdfResultats } from "./export.service";
import { verifierEtCompterExportPdf } from "../abonnements/abonnements.service";

export const exportRouter = Router();
exportRouter.use(exigerAuthentification);

exportRouter.get(
  "/classes/:classeId/periodes/:periodeId/export-pdf",
  async (req: RequeteAuthentifiee, res: Response) => {
    try {
      // Gate plan gratuit (5 PDF / mois)
      await verifierEtCompterExportPdf(req.enseignantId!);

      const pdfBuffer = await genererPdfResultats(
        req.enseignantId!,
        req.params.classeId,
        req.params.periodeId
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="resultats.pdf"'
      );
      res.send(pdfBuffer);
    } catch (err: any) {
      const status = err.statusCode || 400;
      res.status(status).json({
        message: err.message,
        code: err.code || undefined,
      });
    }
  }
);