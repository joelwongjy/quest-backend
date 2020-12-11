import { getRepository } from "typeorm";
import { Answer } from "../entities/questionnaire/Answer";
import { Attempt } from "../entities/questionnaire/Attempt";

/**
 * Associates a list of answers to a given attempt.
 *
 * @param answers List of answer objects.
 * @param attempt attempt object to associate answers with.
 */
export async function associateAttemptWithAnswers(
  answers: Answer[],
  attempt: Attempt
): Promise<Attempt> {
  if (answers.length > 0) {
    attempt.answers = answers;
  }

  const saved = await getRepository(Attempt).save(attempt);
  return saved;
}
