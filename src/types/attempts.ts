import { AnswerPostData } from "./answers";

export interface AttemptPostData {
  userId: number;
  qnnaireWindowId: number;
  answers: AnswerPostData[];
}
