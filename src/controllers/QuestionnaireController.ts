import { Request, Response } from "express";
import { QuestionnaireListData } from "../types/questionnaires";
import { getQuestionnaires } from "../selectors/questionnaires";

export async function getQuestionnaireListData(
  _request: Request,
  response: Response
): Promise<void> {
  const questionnaireListData: QuestionnaireListData[] = await getQuestionnaires();
  response.status(200).json({ questionnaireListData });
}
