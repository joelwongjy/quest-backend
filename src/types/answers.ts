import { OptionData, QuestionData } from "./questions";

export interface AnswerPostData {
  questionOrderId: number;
  optionId?: number;
  textResponse?: string;
}

export interface AnswerData {
  answerId: number;
  questionOrder: QuestionData;
  option?: OptionData | null;
  textResponse?: string | null;
}
