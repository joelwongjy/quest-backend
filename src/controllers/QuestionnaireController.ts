import { Request, Response } from "express";
import { QuestionnaireListData } from "../types/questionnaires";
import { getQuestionnaires } from "../selectors/questionnaires";
import { QuestionnairePostData } from "../types/questionnaires";
import {
  associateQuestionnaireWithClassesAndProgrammes,
  createQuestionnaireWithQuestions,
} from "../utils/questionnaires";

export async function getQuestionnaireListData(
  _request: Request,
  response: Response
): Promise<void> {
  const questionnaireListData: QuestionnaireListData[] = await getQuestionnaires();
  response.status(200).json({ questionnaireListData });
}

export async function create(
  request: Request<{}, any, QuestionnairePostData, any>,
  response: Response
): Promise<void> {
  const {
    name,
    type,
    questionWindows,
    sharedQuestions,
    classes = [],
    programmes = [],
  } = request.body;

  let newQuestionnaire = await createQuestionnaireWithQuestions(
    name,
    type,
    questionWindows,
    sharedQuestions
  );

  newQuestionnaire = await associateQuestionnaireWithClassesAndProgrammes(
    classes,
    programmes,
    newQuestionnaire
  );

  // TODO: this is... weird
  response.status(200).json({ success: true, id: newQuestionnaire.id });
}
