import { AnswerPostData, AnswerData } from "./answers";
import { DiscardableData } from "./entities";
import { QuestionnaireWindowData } from "./questionnaires";
import { UserData } from "./users";

export interface AttemptPostData {
  qnnaireWindowId: number;
  answers: AnswerPostData[];
}

export interface AttemptListData extends DiscardableData {
  user: UserData;
  windowId: number;
}

export interface AttemptFullData extends AttemptListData {
  questionnaireWindow: QuestionnaireWindowData;
  answers: AnswerData[];
}
