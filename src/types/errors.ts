export interface Message {
  message: string;
}

export interface SuccessId {
  success: boolean;
  id?: number;
}

export const QUESTION_ORDER_CREATION_ERROR = "QuestionOrderCreationError";
export const QUESTION_ORDER_EDITOR_ERROR = "QuestionOrderEditorError";
export const QUESTION_ORDER_VIEWER_ERROR = "QuestionOrderViewerError";
export const QUESTION_SET_EDITOR_ERROR = "QuestionSetEditorError";
export const QUESTION_SET_VIEWER_ERROR = "QuestionSetViewerError";
export const QUESTIONNAIRE_WINDOW_VIEWER_ERROR =
  "QuestionnaireWindowViewerError";
export const QUESTIONNAIRE_WINDOW_EDITOR_ERROR =
  "QuestionnareWindowEditorError";
export const ONE_TIME_QUESTIONNAIRE_EDITOR_ERROR =
  "OneTimeQuestionnaireEditorError";
export const PRE_POST_QUESTIONNAIRE_EDITOR_ERROR =
  "PrePostQuestionnaireEditorError";
export const QUESTIONNAIRE_VALIDATOR_ERROR = "QuestionnaireValidatorError";
export const QUESTIONNAIRE_PROGRAMS_AND_CLASSES_EDITOR_ERROR =
  "QuestionnaireProgramAndClassesEditorError";
export const QUESTIONNAIRE_PROGRAMS_AND_CLASSES_CREATOR_ERROR =
  "QuestionnaireProgramAndClassesCreatorError";
export const QUESTIONNAIRE_WINDOW_CREATOR_ERROR =
  "QuestionnaireWindowCreatorError";
export const PRE_POST_QUESTIONNAIRE_CREATOR_ERROR =
  "PrePostQuestionnaireCreatorError";
export const ONE_TIME_QUESTIONNAIRE_CREATOR_ERROR =
  "OneTimeQuestionnaireCreatorError";
