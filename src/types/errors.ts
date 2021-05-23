export interface Message {
  message: string;
}

export interface SuccessId {
  success: boolean;
  id?: number;
}

export const TYPEORM_ENTITYNOTFOUND = "EntityNotFound";

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
export const ONE_TIME_QUESTIONNAIRE_VIEWER_ERROR =
  "OneTimeQuestionnaireViewerError";
export const PRE_POST_QUESTIONNAIRE_VIEWER_ERROR =
  "PrePostQuestionnaireViewerError";

export const PERSON_CREATOR_ERROR = "PersonCreatorError";
export const PERSON_EDITOR_ERROR = "PersonEditorError";
export const PERSON_DELETER_ERROR = "PersonDeleterError";

export const CLASS_PERSON_CREATOR_ERROR = "ClassPersonCreatorError";

export const PROGRAMME_CLASS_CREATOR_ERROR = "ProgrammeClassCreatorError";
export const PROGRAMME_CLASS_DELETOR_ERROR = "ProgrammeClassDeleterError";
export const PROGRAMME_CLASS_EDITOR_ERROR = "ProgrammeClassEditorError";

export const CLASS_EDITOR_ERROR = "ClassEditorError";
