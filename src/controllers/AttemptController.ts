import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import { QuestionnaireWindow } from "../entities/questionnaire/QuestionnaireWindow";
import { Attempt } from "../entities/questionnaire/Attempt";
import { Answer } from "../entities/questionnaire/Answer";
import { associateAttemptWithAnswers } from "../utils/attempts";
import { createAnswers } from "../utils/answers";

export async function create(
  request: Request,
  response: Response
): Promise<void> {
  const { userId, qnnaireWindowId, answers } = request.body;

  const user: User = await getRepository(User).findOneOrFail({
    where: { id: userId },
  });

  const qnnaireWindow: QuestionnaireWindow = await getRepository(
    QuestionnaireWindow
  ).findOneOrFail({
    where: { id: qnnaireWindowId },
  });

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
