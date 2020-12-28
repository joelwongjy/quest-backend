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
import { Message, SuccessId, TYPEORM_ENTITYNOTFOUND } from "../types/errors";

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
  response: Response<SuccessId>
) {
  const { id } = request.params;
  try {
    await getConnection().transaction<void>(async (manager) => {
      const questionnaire = await manager
        .getRepository(Questionnaire)
        .findOneOrFail({
          where: { id },
          relations: [
            "questionnaireWindows",
            "questionnaireWindows.mainSet",
            "questionnaireWindows.mainSet.questionOrders",
            "questionnaireWindows.sharedSet",
            "questionnaireWindows.sharedSet.questionOrders",
            "programmeQuestionnaires",
            "classQuestionnaires",
          ],
        });

      await new QuestionnaireDeleter(manager).deleteQuestionnaire(
        questionnaire
      );
    });

    response.status(200).json({ success: true, id });
    return;
  } catch (e) {
    switch (e.name) {
      case TYPEORM_ENTITYNOTFOUND:
        response.status(404).json({ success: false });
        return;
      default:
        console.log(e);
        response.status(400).json({ success: false });
        return;
    }
  }
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
  request: Request<QuestionnaireId, any, QuestionnairePatchData, any>,
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
