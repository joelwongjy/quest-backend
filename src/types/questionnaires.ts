import { ClassData } from "./classes";
import { DiscardableData } from "./entities";
import { ProgrammeData } from "./programmes";
import {
  QuestionPostData,
  QuestionSetData,
  QuestionSetEditData,
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
  status: QuestionnaireStatus;
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

export interface QuestionnaireWindowEditData extends QuestionSetEditData {
  windowId: number;
  startAt: string;
  endAt: string;
}

export interface QuestionnaireFullData
  extends Omit<
      QuestionnairePostData,
      "questionWindows" | "sharedQuestions" | "classes" | "programmes"
    >,
    QuestionnaireProgramClassData {
  questionnaireId: number;
  questionWindows: QuestionnaireWindowData[];
  sharedQuestions: QuestionSetData | undefined;
}

export interface QuestionnaireOneWindowData
  extends Omit<QuestionnaireFullData, "questionWindows">,
    QuestionnaireWindowData {
  questionnaireId: number;
}

export interface QuestionnaireProgramClassData {
  programmes: ProgrammeData[];
  classes: ClassData[];
}

export interface QuestionnaireEditData
  extends Omit<QuestionnairePostData, "questionWindows" | "sharedQuestions"> {
  questionnaireId: number;
  questionWindows: QuestionnaireWindowEditData[];
  sharedQuestions: QuestionSetEditData | undefined;
}
