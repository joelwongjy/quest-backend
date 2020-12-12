import { AnswerPostData, AnswerData } from "./answers";
import { QuestionnaireWindowData } from "./questionnaires";
import { UserData } from "./users";

export interface AttemptPostData {
  qnnaireWindowId: number;
  answers: AnswerPostData[];
}

export interface AttemptFullData {
  user: UserData;
  questionnaireWindow: QuestionnaireWindowData;
  answers: AnswerData[];
}
