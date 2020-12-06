import { Request, Response } from "express";
import {
  QuestionnaireDeleteData,
  QuestionnaireListData,
} from "../types/questionnaires";
import { selectQuestionnaireData } from "../selectors/questionnaires";
import { QuestionnairePostData } from "../types/questionnaires";
import {
  associateQuestionnaireWithClassesAndProgrammes,
  createQuestionnaireWithQuestions,
} from "../utils/questionnaires";
import { getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";

export async function index(
  _request: Request,
  response: Response
): Promise<void> {
  const questionnaireListData: QuestionnaireListData[] = await selectQuestionnaireData();
  response.status(200).json({ questionnaires: questionnaireListData });
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

  let newQuestionnaire = await createQuestionnaireWithQuestions(
    title,
    type,
    questionWindows ?? [],
    sharedQuestions?.questions ?? []
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
    relations: [
      "questionnaireWindows",
      "questionnaireWindows.mainSet",
      "questionnaireWindows.mainSet.questionOrders",
      "questionnaireWindows.sharedSet",
      "questionnaireWindows.sharedSet.questionOrders",
    ],
  });

  if (!questionnaire) {
    response.sendStatus(404);
    return;
  }

  // soft-delete the questionnaire
  await getRepository(Questionnaire).softRemove(questionnaire);

  // soft-delete the windows
  await getRepository(QuestionnaireWindow).softRemove(
    questionnaire.questionnaireWindows!
  );

  const questionSets: QuestionSet[] = [];
  let questionOrders: QuestionOrder[] = [];
  let includesSharedSet = false;
  questionnaire.questionnaireWindows.forEach((window) => {
    if (window.mainSet) {
      questionSets.push(window.mainSet);
      questionOrders = questionOrders.concat(window.mainSet.questionOrders);
    }

    if (window.sharedSet && !includesSharedSet) {
      questionSets.push(window.sharedSet);
      questionOrders = questionOrders.concat(window.sharedSet.questionOrders);

      includesSharedSet = true;
    }
  });

  // soft-delete the sets
  await getRepository(QuestionSet).softRemove(questionSets);

  // soft-delete the question orders
  await getRepository(QuestionOrder).softRemove(questionOrders);

  response.sendStatus(200);
  return;
}
