import PDFDocument from "pdfkit";
import { AppDataSource } from "../../data-source";
import { Periode } from "../../entities/Periode";
import { Enseignant } from "../../entities/Enseignant";
import { obtenirClasse } from "../classes/classes.service";
import { calculerResultatsClasse } from "../notes/notes.service";

/**
 * Génère le PDF des moyennes/rangs d'une classe pour une période donnée.
 * Réutilise calculerResultatsClasse (même règles : rang masqué si la
 * classe n'est pas à 100% de complétude — voir notes.service.ts).
 */
export async function genererPdfResultats(
  enseignantId: string,
  classeId: string,
  periodeId: string
): Promise<Buffer> {
  const classe = await obtenirClasse(enseignantId, classeId);

  const periodeRepo = AppDataSource.getRepository(Periode);
  const periode = await periodeRepo.findOne({ where: { id: periodeId } });
  if (!periode) {
    throw new Error("Période introuvable.");
  }

  const enseignantRepo = AppDataSource.getRepository(Enseignant);
  const enseignant = await enseignantRepo.findOne({ where: { id: enseignantId } });

  const resultats = await calculerResultatsClasse(classeId, periodeId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // En-tête
    doc.fontSize(16).font("Helvetica-Bold").text("MoyennePro", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Résultats — ${classe.nom} (${classe.niveau})`, { align: "center" });
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(`${periode.nom} — ${periode.annee_scolaire}`, { align: "center" });
    if (enseignant?.matiere) {
      doc.text(`Matière : ${enseignant.matiere.nom}`, { align: "center" });
    }
    doc.fillColor("#000");
    doc.moveDown(1);

    if (resultats.completude < 100) {
      doc
        .fontSize(9)
        .fillColor("#b45309")
        .text(
          `Complétude de la saisie : ${resultats.completude}% — le rang n'est pas encore disponible tant que toutes les notes ne sont pas saisies.`,
          { align: "center" }
        );
      doc.fillColor("#000");
      doc.moveDown(0.8);
    }

    // Tableau
    const startX = doc.x;
    const colEleve = 260;
    const colMoyenne = 110;
    const colRang = 90;

    doc.font("Helvetica-Bold").fontSize(10);
    let y = doc.y;
    doc.text("Élève", startX, y, { width: colEleve });
    doc.text("Moyenne", startX + colEleve, y, { width: colMoyenne });
    doc.text("Rang", startX + colEleve + colMoyenne, y, { width: colRang });
    doc.moveDown(0.4);
    doc
      .moveTo(startX, doc.y)
      .lineTo(startX + colEleve + colMoyenne + colRang, doc.y)
      .strokeColor("#cccccc")
      .stroke();
    doc.moveDown(0.3);
    doc.font("Helvetica").fillColor("#000");

    resultats.resultats.forEach((r) => {
      // Nouvelle page si on approche du bas
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
      const rowY = doc.y;
      doc.text(`${r.nom} ${r.prenom}`, startX, rowY, { width: colEleve });
      doc.text(r.moyenne !== null ? r.moyenne.toFixed(2) : "—", startX + colEleve, rowY, {
        width: colMoyenne,
      });
      doc.text(r.rang !== null ? String(r.rang) : "—", startX + colEleve + colMoyenne, rowY, {
        width: colRang,
      });
      doc.moveDown(0.6);
    });

    doc.moveDown(1.5);
    doc
      .fontSize(8)
      .fillColor("#888888")
      .text(`Généré le ${new Date().toLocaleDateString("fr-FR")} via MoyennePro`, {
        align: "right",
      });

    doc.end();
  });
}
