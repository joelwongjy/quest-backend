import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { Attempt } from "../entities/questionnaire/Attempt";
import { Answer } from "../entities/questionnaire/Answer";
import { associateAttemptWithAnswers } from "../utils/attempts";
import { createAnswers } from "../utils/answers";
import { AccessTokenSignedPayload } from "../types/tokens";

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
