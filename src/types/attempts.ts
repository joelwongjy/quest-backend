import { AnswerPostData } from "./answers";

export interface AttemptPostData {
  qnnaireWindowId: number;
  answers: AnswerPostData[];
}
