// backend/src/modules/classes/dashboard.service.ts
import { AppDataSource } from "../../data-source";
import { Classe } from "../../entities/Classe";
import { Devoir } from "../../entities/Devoir";
import { Note } from "../../entities/Note";
import { Eleve } from "../../entities/Eleve";

export async function obtenirDashboard(enseignantId: string) {
    const classeRepo = AppDataSource.getRepository(Classe);
    const devoirRepo = AppDataSource.getRepository(Devoir);
    const noteRepo = AppDataSource.getRepository(Note);
    const eleveRepo = AppDataSource.getRepository(Eleve);

    // 1. Classes de l'enseignant
    const classes = await classeRepo.find({
        where: { enseignant: { id: enseignantId } },
        relations: { eleves: true },
        order: { nom: "ASC" },
    });

    const classeIds = classes.map((c) => c.id);

    // 2. Tous les devoirs de ces classes
    const devoirs = classeIds.length
        ? await devoirRepo
            .createQueryBuilder("devoir")
            .leftJoinAndSelect("devoir.classe", "classe")
            .leftJoinAndSelect("devoir.notes", "notes")
            .where("classe.id IN (:...classeIds)", { classeIds })
            .orderBy("devoir.date", "DESC")
            .getMany()
        : [];

    // 3. Calcul des saisies en attente (devoirs non complets)
    const saisiesEnAttente = [];

    for (const devoir of devoirs) {
        const totalEleves = devoir.classe?.eleves?.length || 0;
        if (totalEleves === 0) continue;

        const notesSaisies = (devoir.notes || []).filter(
            (n) => n.absent || (n.valeur !== null && n.valeur !== undefined)
        ).length;

        // On ne garde que les devoirs incomplets
        if (notesSaisies < totalEleves) {
            saisiesEnAttente.push({
                id: devoir.id,
                nomDevoir: devoir.nom,
                classeNom: devoir.classe.nom,
                classeId: devoir.classe.id,
                notesSaisies,
                totalEleves,
            });
        }
    }

    // On limite à 5 saisies en attente max pour le dashboard
    const saisiesLimitees = saisiesEnAttente.slice(0, 5);

    // 4. Résumé
    const nombreEleves = classes.reduce(
        (acc, c) => acc + (c.eleves?.length || 0),
        0
    );

    // 5. Classes enrichies avec complétude (simplifiée pour V1)
    const classesEnrichies = classes.map((classe) => {
        const devoirsClasse = devoirs.filter((d) => d.classe.id === classe.id);
        let totalNotesAttendues = 0;
        let totalNotesSaisies = 0;

        for (const devoir of devoirsClasse) {
            const nbEleves = classe.eleves?.length || 0;
            totalNotesAttendues += nbEleves;
            totalNotesSaisies += (devoir.notes || []).filter(
                (n) => n.absent || n.valeur !== null
            ).length;
        }

        const completude =
            totalNotesAttendues > 0
                ? Math.round((totalNotesSaisies / totalNotesAttendues) * 100)
                : 0;

        return {
            id: classe.id,
            nom: classe.nom,
            niveau: classe.niveau,
            anneeScolaire: classe.annee_scolaire,
            nombreEleves: classe.eleves?.length || 0,
            completude,
        };
    });

    return {
        resume: {
            nombreClasses: classes.length,
            nombreEleves,
            periodeEnCours: "Période en cours", // on pourra l’améliorer plus tard
        },
        saisiesEnAttente: saisiesLimitees,
        classes: classesEnrichies,
    };
}