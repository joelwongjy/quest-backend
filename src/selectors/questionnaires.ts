import { startOfToday } from "date-fns";
import { createQueryBuilder, getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionnaireListData } from "../types/questionnaires";

export async function getQuestionnaires(): Promise<QuestionnaireListData[]> {
  const result: QuestionnaireListData[] = [];

  const questionnaires: Questionnaire[] = await getRepository(Questionnaire)
    .createQueryBuilder("questionnaire")
    .getMany();

  for (let questionnaire of questionnaires) {
    const {
      id,
      name,
      questionnaireWindows,
      discardedAt,
      createdAt,
      updatedAt,
    } = questionnaire;
    const status = questionnaire.questionnaireStatus;

    const windows: QuestionnaireWindow[] = await getRepository(
      QuestionnaireWindow
    )
      .createQueryBuilder("window")
      .where("window.questionnaire.id = :id", { id: id })
      .getMany();

    for (let window of windows) {
      const startAt = window.openAt;
      const endAt = window.closeAt;
      result.push({
        id: id,
        discardedAt: discardedAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
        name: name,
        status: status,
        startAt: startAt,
        endAt: endAt,
      });
    }
  }

  return result;
}
