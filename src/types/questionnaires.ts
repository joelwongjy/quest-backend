import { ClassData } from "./classes";
import { DiscardableData } from "./entities";
import { ProgrammeData } from "./programmes";
import {
  QuestionPostData,
  QuestionSetData,
  QuestionSetPatchData,
  QuestionSetPostData,
} from "./questions";

export enum QuestionnaireType {
  ONE_TIME = "ONE TIME",
  PRE_POST = "PRE POST",
}

export enum QuestionnaireListDataType {
  PRE = "PRE",
  POST = "POST",
  ONE_TIME = "ONE TIME",
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
  classes: number[];
  programmes: number[];
}

export interface QuestionnaireWindowPostData {
  startAt: Date;
  endAt: Date;
  questions: QuestionPostData[];
}

export interface QuestionnairePatchData
  extends Omit<QuestionnairePostData, "questionWindows" | "sharedQuestions"> {
  status: QuestionnaireStatus;
  questionWindows: QuestionnaireWindowPatchData[];
  sharedQuestions?: QuestionSetPatchData;
}

export interface QuestionnaireListData extends DiscardableData {
  name: string;
  startAt: Date;
  endAt: Date;
  status: QuestionnaireStatus;
  type: QuestionnaireListDataType;
}

export interface QuestionnaireId {
  id: number;
}

export interface QuestionnaireWindowId extends QuestionnaireId {
  windowId: string;
}

export interface QuestionnaireWindowData extends QuestionSetData {
  windowId: number;
  startAt: string;
  endAt: string;
}

export interface QuestionnaireWindowPatchData extends QuestionSetPatchData {
  windowId: number;
  startAt: string;
  endAt: string;
}

export interface QuestionnaireFullData extends QuestionnaireProgramClassData {
  title: string;
  type: QuestionnaireType;
  status: QuestionnaireStatus;
  questionnaireId: number;
  questionWindows: QuestionnaireWindowData[];
  sharedQuestions?: QuestionSetData;
}

export interface QuestionnaireOneWindowData
  extends Omit<QuestionnaireFullData, "questionWindows">,
    QuestionnaireWindowData {}

export interface QuestionnaireProgramClassData {
  programmes: ProgrammeData[];
  classes: ClassData[];
}
