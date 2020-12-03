import { Request, Response } from "express";
import {
  QuestionnaireDeleteData,
  QuestionnaireListData,
} from "../types/questionnaires";
import { getQuestionnaires } from "../selectors/questionnaires";
import { QuestionnairePostData } from "../types/questionnaires";
import {
  associateQuestionnaireWithClassesAndProgrammes,
  createQuestionnaireWithQuestions,
} from "../utils/questionnaires";
import { AccessTokenSignedPayload } from "../types/tokens";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { DefaultUserRole } from "../types/users";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";

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
    title,
    type,
    questionWindows,
    sharedQuestions,
    classes = [],
    programmes = [],
  } = request.body;
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  const user = await getRepository(User).findOne({
    where: { id: userId },
    select: ["id", "defaultRole"],
  });
  if (!user || user.defaultRole != DefaultUserRole.ADMIN) {
    response.sendStatus(401);
    return;
  }

  let newQuestionnaire = await createQuestionnaireWithQuestions(
    title,
    type,
    questionWindows,
    sharedQuestions.questions
  );

  newQuestionnaire = await associateQuestionnaireWithClassesAndProgrammes(
    classes,
    programmes,
    newQuestionnaire
  );

  response.status(200).json({ success: true, id: newQuestionnaire.id });
  return;
}

export async function softDelete(
  request: Request<QuestionnaireDeleteData, any, any, any>,
  response: Response
) {
  const { id } = request.params;
  const questionnaire = await getRepository(Questionnaire).findOne({
    where: { id },
    relations: ["questionnaireWindows"],
  });

  if (!questionnaire) {
    response.sendStatus(404);
    return;
  }

  // unlikely to happen based on create
  // TODO: Need to type this and communicate to front-end properly in case it happens
  if (!questionnaire?.questionnaireWindows.length) {
    response
      .status(400)
      .json({ message: `Questionnaire ${id} has 0 associated windows.` });
    return;
  }

  // soft-delete the questionnaire
  await getRepository(Questionnaire).softRemove(questionnaire);

  await getRepository(QuestionnaireWindow).softRemove(
    questionnaire?.questionnaireWindows!
  );

  response.sendStatus(200);
  return;
}
