export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE CHOICE",
  MOOD = "MOOD",
  SHORT_ANSWER = "SHORT ANSWER",
  LONG_ANSWER = "LONG ANSWER",
  SCALE = "SCALE",
}

export enum Mood {
  VERY_GOOD = "MOOD - VERY GOOD",
  GOOD = "MOOD - GOOD",
  NORMAL = "MOOD - NORMAL",
  BAD = "MOOD - BAD",
  VERY_BAD = "MOOD - VERY BAD",
}

export enum Scale {
  ONE = "SCALE 1",
  TWO = "SCALE 2",
  THREE = "SCALE 3",
  FOUR = "SCALE 4",
  FIVE = "SCALE 5",
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

export interface QuestionData {
  qnOrderId: number;
  order: number;
  questionType: QuestionType;
  questionText: string;
  options: OptionData[];
}

export interface QuestionSetData {
  questions: QuestionData[];
}

export interface QuestionSetEditData {
  questions: (QuestionData | QuestionPostData)[];
}
