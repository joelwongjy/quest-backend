import { Answer } from "../entities/questionnaire/Answer";
import { Option } from "../entities/questionnaire/Option";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";
import { AnswerPostData } from "../types/answers";
import { getRepository } from "typeorm";

export async function createAnswers(
  answers: AnswerPostData[]
): Promise<Answer[]> {
  const result: Answer[] = [];

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

      const savedAnswer = await getRepository(Answer).save(createdAnswer);

      result.push(savedAnswer);
    })
  );

  return result;
}
