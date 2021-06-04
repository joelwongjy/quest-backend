import { Answer } from "../entities/questionnaire/Answer";
import { Option } from "../entities/questionnaire/Option";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import { AnswerPostData } from "../types/answers";
import { getRepository } from "typeorm";
import { Attempt } from "src/entities/questionnaire/Attempt";

export async function createAnswers(
  answers: AnswerPostData[],
  attempt: Attempt
): Promise<Answer[]> {
  let result: Answer[] = [];

  // TODO: refactor the Attempt/Answer into its own clas
  // An additional benefit to use classes is to utilise transactions
  if (!attempt.id) {
    throw new Error("The given attempt has no id");
  }

  await Promise.all(
    answers.map(async (answer) => {
      const questionOrder: QuestionOrder = await getRepository(
        QuestionOrder
      ).findOneOrFail({
        where: { id: answer.questionOrderId },
      });

      const optionId = answer.optionId ?? null;
      let createdAnswer: Answer;

      if (optionId) {
        // answer provided for a Multiple Choice question
        let option: Option = await getRepository(Option).findOneOrFail({
          where: { id: optionId },
        });
        createdAnswer = new Answer(questionOrder, option);
      } else {
        // answer provided for a non-multiple choice question
        createdAnswer = new Answer(
          questionOrder,
          undefined,
          answer.textResponse
        );
      }

      createdAnswer.attempt = attempt;
      result.push(createdAnswer);
    })
  );

  result = await getRepository(Answer).save(result);

  return result;
}
