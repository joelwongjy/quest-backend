import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { Attempt } from "../entities/questionnaire/Attempt";
import { Answer } from "../entities/questionnaire/Answer";
import { associateAttemptWithAnswers } from "../utils/attempts";
import { createAnswers } from "../utils/answers";
import { AccessTokenSignedPayload } from "../types/tokens";
import { AttemptFullData } from "../types/attempts";
import { Message } from "../types/errors";
import { UserData } from "../types/users";
import { QuestionnaireWindowData } from "../types/questionnaires";
import { AnswerData } from "../types/answers";
import { QuestionData } from "../types/questions";

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
  const answersProvided: Answer[] = await createAnswers(answers);

  // associate createdAttempt to answers provided
  createdAttempt = await associateAttemptWithAnswers(
    answersProvided,
    createdAttempt
  );

  response.status(200).json({ success: true, id: createdAttempt.id });

  return;
}

export async function show(
  request: Request,
  response: Response<AttemptFullData | Message>
): Promise<void> {
  const { id } = request.params;

  try {
    let attempt = await getRepository(Attempt).findOne({
      where: { id },
      relations: [
        "user",
        "questionnaireWindow",
        "answers",
        "answers.questionOrder",
        "answers.questionOrder.question",
        "questionnaireWindow.mainSet",
        "questionnaireWindow.mainSet.questionOrder",
      ],
    });

    if (!attempt) {
      response.sendStatus(404);
      return;
    }

    const user: UserData = await attempt.user.getData();

    const {
      id: windowId,
      openAt: startAt,
      closeAt: endAt,
    } = attempt.questionnaireWindow;
    const questions: QuestionData[] = await attempt.questionnaireWindow.mainSet.getQuestionOrders();
    const questionnaireWindow: QuestionnaireWindowData = {
      windowId,
      startAt: startAt.toString(),
      endAt: endAt.toString(),
      questions,
    };

    const answers: AnswerData[] = attempt.answers;

    const result: AttemptFullData = {
      user: user,
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
