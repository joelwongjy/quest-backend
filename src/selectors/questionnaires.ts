import { startOfToday } from "date-fns";
import { createQueryBuilder, getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionnaireListData } from "../types/questionnaires";

export async function getQuestionnaires(): Promise<QuestionnaireListData[]> {
  const result: QuestionnaireListData[] = [];

  const questionnairesAndWindows: Questionnaire[] = await getRepository(
    Questionnaire
  )
    .createQueryBuilder("questionnaire")
    .innerJoin("questionnaire.questionnaireWindows", "windows")
    .getMany();

  for (let questionnaire of questionnairesAndWindows) {
    const {
      id,
      name,
      questionnaireWindows,
      discardedAt,
      createdAt,
      updatedAt,
    } = questionnaire;
    const status = questionnaire.questionnaireStatus;
    for (let window of questionnaireWindows) {
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
