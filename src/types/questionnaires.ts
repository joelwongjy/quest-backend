import { DiscardableData } from "./entities";
import {
  QuestionPostData,
  QuestionSetData,
  QuestionSetPostData,
} from "./questions";

export enum QuestionnaireType {
  ONE_TIME = "ONE TIME",
  PRE_POST = "PRE POST",
}

export enum QuestionnaireStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export interface QuestionnairePostData {
  title: string;
  type: QuestionnaireType;
  questionWindows: QuestionnaireWindowPostData[];
  sharedQuestions: QuestionSetPostData;
  classes?: number[];
  programmes?: number[];
}

export interface QuestionnaireWindowPostData {
  startAt: Date;
  endAt: Date;
  questions: QuestionPostData[];
}

export interface QuestionnaireListData extends DiscardableData {
  name: string;
  startAt: Date;
  endAt: Date;
  status: QuestionnaireStatus;
}

export interface QuestionnaireIdData {
  id: number;
}

export interface QuestionnaireWindowData
  extends Omit<QuestionnaireWindowPostData, "questions">,
    QuestionSetData {
  windowId: number;
}

export interface QuestionnaireData
  extends Omit<QuestionnairePostData, "questionWindows" | "sharedQuestions"> {
  questionnaireId: number;
  questionWindows: QuestionnaireWindowData[];
  sharedQuestions: QuestionSetData;
}
