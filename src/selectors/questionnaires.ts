import { getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireListData } from "../types/questionnaires";

const ENTITY_NAME = "questionnaire";

export async function selectQuestionnaireData(): Promise<
  QuestionnaireListData[]
> {
  const result: QuestionnaireListData[] = [];

  const questionnaires: Questionnaire[] = await getRepository(Questionnaire)
    .createQueryBuilder(ENTITY_NAME)
    .getMany();

  await Promise.all(
    questionnaires.map(async (q: Questionnaire) => {
      const windows = await q.getListDataList();
      windows.forEach((w) => result.push(w));
    })
  );

  return result;
}
