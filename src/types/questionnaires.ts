import { DiscardableData } from "./entities";
import { QuestionPostData } from "./questions";

export enum QuestionnaireType {
  ONE_TIME = "ONE TIME",
  PRE_POST = "PRE POST",
}

export enum QuestionnaireStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export interface QuestionnairePostData {
  name: string;
  type: QuestionnaireType;
  questionWindows: QuestionnaireWindowPostData[];
  sharedQuestions: QuestionPostData[];
  classes: number[];
  programmes: number[];
}

export interface QuestionnaireWindowPostData {
  openAt: Date;
  closeAt: Date;
  questions: QuestionPostData[];
}

export interface QuestionnaireListData extends DiscardableData {
  name: string;
  startAt: Date;
  endAt: Date;
  status: QuestionnaireStatus;
}
