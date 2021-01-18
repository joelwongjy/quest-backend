import { AnswerPostData, AnswerData } from "./answers";
import { DiscardableData } from "./entities";
import { QuestionnaireWindowData, QuestionnaireType } from "./questionnaires";
import { UserData } from "./users";

export interface AttemptPostData {
  qnnaireWindowId: number;
  answers: AnswerPostData[];
}

export interface AttemptListData extends DiscardableData {
  user: UserData;
  windowId: number;
}

export interface AttemptData {
  questionnaireWindow: QuestionnaireWindowData;
  answers: AnswerData[];
}
export interface AttemptFullData {
  user: UserData;
  title: string;
  dateSubmitted: Date | Date[];
  type: QuestionnaireType;
  questionnaireWindow: QuestionnaireWindowData | QuestionnaireWindowData[];
  answers: SharedQnnaireAnswerData | AnswerData[];
}

// private interface, only for AttemptFullData
export interface SharedQnnaireAnswerData {
  answersAfter: AnswerData[];
  answersBefore: AnswerData[];
  sharedAnswersBefore: AnswerData[];
  sharedAnswersAfter: AnswerData[];
}
