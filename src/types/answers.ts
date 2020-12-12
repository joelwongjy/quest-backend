import { Option } from "../entities/questionnaire/Option";
import { QuestionOrder } from "../entities/questionnaire/QuestionOrder";

export interface AnswerPostData {
  questionOrderId: number;
  optionId?: number;
  textResponse?: string;
}

export interface AnswerData {
  questionOrder: QuestionOrder;
  option?: Option | null;
  textResponse?: string | null;
}
