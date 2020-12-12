import { Request, Response } from "express";
import {
  QuestionnaireEditData,
  QuestionnaireFullData,
  QuestionnaireId,
  QuestionnaireListData,
  QuestionnaireOneWindowData,
  QuestionnaireType,
  QuestionnaireWindowId,
} from "../types/questionnaires";
import { selectQuestionnaireData } from "../selectors/questionnaires";
import { QuestionnairePostData } from "../types/questionnaires";
import {
  OneTimeQuestionnaireCreator,
  OneTimeQuestionnaireEditor,
  PrePostQuestionnaireCreator,
  PrePostQuestionnaireEditor,
  QuestionnaireCreator,
  QuestionnaireEditor,
} from "../utils/questionnaires";
import { getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { QuestionSet } from "../entities/questionnaire/QuestionSet";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import { Message, SuccessId } from "../types/errors";

export async function index(
  _request: Request,
  response: Response
): Promise<void> {
  const questionnaireListData: QuestionnaireListData[] = await selectQuestionnaireData();
  response.status(200).json({ questionnaires: questionnaireListData });
}

export async function create(
  request: Request<{}, any, QuestionnairePostData, any>,
  response: Response<SuccessId>
): Promise<void> {
  let creator: QuestionnaireCreator;
  let result: Questionnaire;

  try {
    const { type } = request.body;
    switch (type) {
      case QuestionnaireType.ONE_TIME:
        creator = new OneTimeQuestionnaireCreator(request.body);
        result = await creator!.createQuestionnaire();
        break;
      case QuestionnaireType.PRE_POST:
        creator = new PrePostQuestionnaireCreator(request.body);
        result = await creator!.createQuestionnaire();
        break;
      default:
        break;
    }

    if (result!) {
      response.status(200).json({ success: true, id: result.id });
      return;
    } else {
      response.status(400).json({ success: false });
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400).json({ success: false });
    return;
  }
}

export async function softDelete(
  request: Request<QuestionnaireId, any, any, any>,
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

export async function show(
  request: Request<QuestionnaireId, any, any, any>,
  response: Response<QuestionnaireFullData | Message>
): Promise<void> {
  const { id } = request.params;

  try {
    const qnnaire = await getRepository(Questionnaire).findOne({
      select: ["id"],
      where: { id },
    });

    if (!qnnaire) {
      response.sendStatus(404);
      return;
    }

    const result = await qnnaire!.getAllWindows();
    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}

export async function showWindow(
  request: Request<QuestionnaireWindowId, any, any, any>,
  response: Response<QuestionnaireOneWindowData | Message>
): Promise<void> {
  const { id, windowId } = request.params;

  try {
    const qnnaire = await getRepository(Questionnaire).findOne({
      select: ["id"],
      where: { id },
    });
    if (!qnnaire) {
      response.sendStatus(404);
      return;
    }

    const windowIdInt = parseInt(windowId, 10);
    if (isNaN(windowIdInt)) {
      response
        .status(400)
        .json({ message: `Invalid windowId received (is: ${windowId})` });
      return;
    }

    const result = await qnnaire!.getMainWindow(windowIdInt);
    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}

export async function edit(
  request: Request<QuestionnaireId, any, QuestionnaireEditData, any>,
  response: Response<QuestionnaireFullData | Message>
): Promise<void> {
  const { id } = request.params;
  const editData = request.body;

  try {
    const qnnaire = await getRepository(Questionnaire).findOneOrFail({
      where: { id },
      relations: [
        "questionnaireWindows",
        "questionnaireWindows.mainSet",
        "questionnaireWindows.sharedSet",
        "questionnaireWindows.mainSet.questionOrders",
        "questionnaireWindows.sharedSet.questionOrders",
        "programmeQuestionnaires",
        "classQuestionnaires",
        "programmeQuestionnaires.programme",
        "classQuestionnaires.class",
      ],
    });

    let editor: QuestionnaireEditor;
    switch (qnnaire.questionnaireType) {
      case QuestionnaireType.ONE_TIME:
        editor = new OneTimeQuestionnaireEditor(qnnaire, editData);
        break;
      case QuestionnaireType.PRE_POST:
        editor = new PrePostQuestionnaireEditor(qnnaire, editData);
        break;
      default:
        response.status(400).json({ message: "Unknown QuestionnaireType" });
        return;
    }

    const updated = await editor.editQnnaire();
    const result = await updated.getAllWindows();
    response.status(200).json(result);
  } catch (e) {
    console.log(e);
    response.status(400).json({ message: e.message });
  }
}
