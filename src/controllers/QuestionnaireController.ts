import { Request, Response } from "express";
import { QuestionnairePostData } from "../types/questionnaires";
import {
  associateQuestionnaireWithClassesAndProgrammes,
  createQuestionnaireWithQuestions,
} from "../utils/questionnaires";

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
