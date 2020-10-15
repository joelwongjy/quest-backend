import { Request, Response } from "express";
import { QuestionnairePostData } from "../types/questionnaires";
import { createQuestionnaireWithQuestions } from "../utils/questionnaires";

export async function create(
  request: Request<{}, any, QuestionnairePostData, any>,
  response: Response
): Promise<void> {
  const { name, type, questionWindows, sharedQuestions } = request.body;
  const newQuestionnare = await createQuestionnaireWithQuestions(
    name,
    type,
    questionWindows,
    sharedQuestions
  );

  // TODO: this is... weird
  response.status(200).json({ success: true, id: newQuestionnare.id });
}
