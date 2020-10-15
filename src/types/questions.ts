export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE CHOICE",
  MOOD = "MOOD",
  SHORT_ANSWER = "SHORT ANSWER",
  LONG_ANSWER = "LONG ANSWER",
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
