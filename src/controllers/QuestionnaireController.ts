import { Request, Response } from "express";
import {
  QuestionnairePatchData,
  QuestionnaireFullData,
  QuestionnaireId,
  QuestionnaireListData,
  QuestionnaireOneWindowData,
  QuestionnaireType,
  QuestionnaireWindowId,
  QuestionnairePostData,
} from "../types/questionnaires";
import { selectQuestionnaireData } from "../selectors/questionnaires";
import {
  OneTimeQuestionnaireCreator,
  OneTimeQuestionnaireEditor,
  PrePostQuestionnaireCreator,
  PrePostQuestionnaireEditor,
  QuestionnaireCreator,
  QuestionnaireEditor,
  QuestionnaireDeleter,
} from "../services/questionnaire";
import { getConnection, getRepository } from "typeorm";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import {
  ENTITY_NOT_FOUND,
  GENERIC_ERROR,
  QuestRes,
  TYPEORM_ENTITYNOTFOUND,
} from "../types/errors";

export async function index(
  _request: Request<{}, {}, {}, {}>,
  response: Response<QuestRes<{ questionnaires: QuestionnaireListData[] }>>
): Promise<void> {
  const questionnaireListData: QuestionnaireListData[] =
    await selectQuestionnaireData();
  response
    .status(200)
    .json({ success: true, questionnaires: questionnaireListData })
    .send();
  return;
}

export async function create(
  request: Request<{}, {}, QuestionnairePostData, {}>,
  response: Response<QuestRes<{}>>
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
        throw new Error("Invalid questionnaire type.");
    }

    // The createQuestionnaire method should either succced or throw
    response.status(200).json({ success: true, id: result!.id }).send();
    return;
  } catch (e) {
    console.log(e);
    response
      .status(400)
      .json({ success: false, message: e.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

export async function softDelete(
  request: Request<QuestionnaireId, {}, {}, {}>,
  response: Response<QuestRes<{}>>
) {
  const { id } = request.params;
  try {
    await getConnection().transaction<void>(async (manager) => {
      await new QuestionnaireDeleter(manager).deleteQuestionnaire(id);
    });

    response.status(200).json({ success: true, id }).send();
    return;
  } catch (e) {
    switch (e.name) {
      case TYPEORM_ENTITYNOTFOUND:
        response
          .status(404)
          .json({ success: false, message: ENTITY_NOT_FOUND })
          .send();
        return;
      default:
        console.log(e);
        response
          .status(400)
          .json({ success: false, message: e.message ?? GENERIC_ERROR })
          .send();
        return;
    }
  }
}

export async function show(
  request: Request<QuestionnaireId, {}, {}, {}>,
  response: Response<QuestRes<QuestionnaireFullData | {}>>
): Promise<void> {
  const { id } = request.params;

  try {
    const qnnaire = await getRepository(Questionnaire).findOne({
      select: ["id"],
      where: { id },
    });

    if (!qnnaire) {
      response
        .status(404)
        .json({ success: false, message: ENTITY_NOT_FOUND })
        .send();
      return;
    }
    const result = await qnnaire!.getAllWindows();
    response
      .status(200)
      .json({ success: true, ...result })
      .send();
    return;
  } catch (e) {
    response
      .status(400)
      .json({ success: false, message: e.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

export async function showWindow(
  request: Request<QuestionnaireWindowId, {}, {}, {}>,
  response: Response<QuestRes<QuestionnaireOneWindowData | {}>>
): Promise<void> {
  const { id, windowId } = request.params;

  try {
    const qnnaire = await getRepository(Questionnaire).findOne({
      select: ["id"],
      where: { id },
    });
    if (!qnnaire) {
      response
        .status(404)
        .json({ success: false, message: ENTITY_NOT_FOUND })
        .send();
      return;
    }

    const windowIdInt = parseInt(windowId, 10);
    if (isNaN(windowIdInt)) {
      response
        .status(400)
        .json({
          success: false,
          message: `Invalid windowId received (is: ${windowId})`,
        })
        .send();
      return;
    }

    const result = await qnnaire!.getMainWindow(windowIdInt);
    response
      .status(200)
      .json({ success: true, ...result })
      .send();
    return;
  } catch (e) {
    response
      .status(400)
      .json({ success: false, message: e.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

export async function edit(
  request: Request<QuestionnaireId, {}, QuestionnairePatchData, {}>,
  response: Response<QuestRes<QuestionnaireFullData | {}>>
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
        response
          .status(400)
          .json({ success: false, message: "Unknown QuestionnaireType" })
          .send();
        return;
    }

    const updated = await editor.editQnnaire();
    const result = await updated.getAllWindows();
    response
      .status(200)
      .json({ success: true, ...result })
      .send();
    return;
  } catch (e) {
    console.log(e);
    response
      .status(400)
      .json({ success: false, message: e.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}
