import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { Attempt } from "../entities/questionnaire/Attempt";
import { Answer } from "../entities/questionnaire/Answer";
import {
  getAttemptsForOneTimeQnnaire,
  getAttemptsForPrePostQnnaire,
} from "../utils/attempts";
import { createAnswers } from "../utils/answers";
import { AccessTokenSignedPayload } from "../types/tokens";
import {
  AttemptData,
  AttemptFullData,
  AttemptListData,
} from "../types/attempts";
import { Message } from "../types/errors";
import {
  QuestionnaireType,
  QuestionnaireWindowData,
} from "../types/questionnaires";
import { QuestionData } from "../types/questions";
import { AnswerData } from "../types/answers";

export async function create(
  request: Request,
  response: Response
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  const { qnnaireWindowId, answers } = request.body;
  let user: User;
  let qnnaireWindow: QuestionnaireWindow;

  try {
    user = await getRepository(User).findOneOrFail({
      where: { id: userId },
    });

    qnnaireWindow = await getRepository(QuestionnaireWindow).findOneOrFail({
      where: { id: qnnaireWindowId },
    });
  } catch (e) {
    // when qnnaireWindowId or userId is invalid
    response.status(400).json({ message: e.message });
    return;
  }

  let createdAttempt = new Attempt(user, qnnaireWindow);
  createdAttempt = await getRepository(Attempt).save(createdAttempt);

  // create answers
  await createAnswers(answers, createdAttempt);

  response.status(200).json({ success: true, id: createdAttempt.id });

  return;
}

/**
 * Returns all Attempts of a given Questionnaire
 * @param request : accepts questionnaireId as params input
 * @param response : a list of AttemptFullData
 */
export async function showByQuestionnaire(
  request: Request,
  response: Response<AttemptFullData[] | Message>
): Promise<void> {
  const { id } = request.params;

  try {
    let qnnaire = await getRepository(Questionnaire).findOne({
      where: { id },
    });

    if (!qnnaire) {
      response.sendStatus(404);
      return;
    }

    const qnnaireFullData = await qnnaire!.getAllWindows();
    const { title, type, questionWindows } = qnnaireFullData;
    let result: AttemptFullData[];

    switch (type) {
      case QuestionnaireType.ONE_TIME:
        result = await getAttemptsForOneTimeQnnaire(title, questionWindows);
        break;
      case QuestionnaireType.PRE_POST:
        result = await getAttemptsForPrePostQnnaire(title, questionWindows);
        break;
      default:
        throw new Error(`Unknown QuestionnaireType.`);
    }

    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}

export async function show(
  request: Request,
  response: Response<AttemptData | Message>
): Promise<void> {
  const { id } = request.params;

  try {
    let attempt = await getRepository(Attempt).findOne({
      where: { id },
      relations: [
        "questionnaireWindow",
        "answers",
        "answers.questionOrder",
        "answers.questionOrder.question",
        "answers.option",
        "questionnaireWindow.mainSet",
      ],
    });

    if (!attempt) {
      response.sendStatus(404);
      return;
    }

    const {
      id: windowId,
      openAt: startAt,
      closeAt: endAt,
    } = attempt.questionnaireWindow;
    const questions: QuestionData[] =
      await attempt.questionnaireWindow.mainSet.getQuestionOrders();
    const questionnaireWindow: QuestionnaireWindowData = {
      windowId,
      startAt: startAt.toString(),
      endAt: endAt.toString(),
      questions,
    };

    const answers: AnswerData[] = attempt.answers.map((answer) =>
      answer.getData()
    );

    const result: AttemptData = {
      ...(await attempt.getListData()),
      questionnaireWindow: questionnaireWindow,
      answers: answers,
    };

    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}

export async function index(
  request: Request,
  response: Response<AttemptListData[] | Message>
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;
  try {
    const attempts = await getRepository(Attempt).find({
      where: { user: { id: userId } }, // intentionally did not filter for discarded
    });
    const result = await Promise.all(attempts.map((a) => a.getListData()));
    response.status(200).json(result);
    return;
  } catch (e) {
    response.status(400).json({ message: e.message });
    return;
  }
}
