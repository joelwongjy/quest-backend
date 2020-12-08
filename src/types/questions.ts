export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE CHOICE",
  MOOD = "MOOD",
  SHORT_ANSWER = "SHORT ANSWER",
  LONG_ANSWER = "LONG ANSWER",
  SCALE = "SCALE",
}

export interface QuestionPostData {
  order: number;
  questionType: QuestionType;
  questionText: string;
  options?: OptionPostData[];
}

export interface OptionPostData {
  optionText: string;
}

export interface QuestionSetPostData {
  questions: QuestionPostData[];
}

export interface OptionData extends OptionPostData {
  optionId: number;
}

export interface QuestionData extends Omit<QuestionPostData, "options"> {
  qnOrderId: number;
  options: OptionData[];
}

export interface QuestionSetData {
  questions: QuestionData[];
}
