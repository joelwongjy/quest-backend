import { getRepository, In } from "typeorm";
import { Answer } from "../entities/questionnaire/Answer";
import { Attempt } from "../entities/questionnaire/Attempt";
import { AttemptFullData, SharedQnnaireAnswerData } from "../types/attempts";
import {
  QuestionnaireType,
  QuestionnaireWindowData,
} from "../types/questionnaires";
import { QuestionData } from "../types/questions";

/**
 * Associates a list of answers to a given attempt
 *
 * @param answers List of answer objects
 * @param attempt attempt object to associate answers with
 */
export async function associateAttemptWithAnswers(
  answers: Answer[],
  attempt: Attempt
): Promise<Attempt> {
  if (answers.length > 0) {
    attempt.answers = answers;
  }

  const saved = await getRepository(Attempt).save(attempt);
  return saved;
}

/**
 * Reduces a list of QuestionData to a set of Question Order ids
 *
 * @param questions A list of QuestionData
 */
function getQuestionIdSet(questions: QuestionData[] | undefined): Set<Number> {
  const result: Set<Number> = new Set<Number>();

  if (!questions) {
    return result;
  }

  for (const question of questions) {
    result.add(question.qnOrderId);
  }

  return result;
}

/**
 * Deduces sets of question order ids for pre-main, post-main and shared questions of a Pre-Post Questionnaire
 *
 * @param preWindowId The QuestionnaireWindow id of the Pre Questionnaire
 * @param postWindowId The QuestionnaireWindow id of the Post Questionnaire
 * @param attempts A list of Attempt Entity data
 */
async function populateQuestionIdSets(
  preWindowId: Number,
  postWindowId: Number,
  attempts: Attempt[]
): Promise<Set<Number>[]> {
  const result: Set<Number>[] = [];

  if (attempts.length == 0) {
    return result;
  }

  let sharedQuestionsIdSet: Set<Number> = getQuestionIdSet(
    await attempts[0].questionnaireWindow.sharedSet?.getQuestionOrders()
  );
  let mainQuestionsBeforeIdSet: Set<Number> = new Set<Number>();
  let mainQuestionsAfterIdSet: Set<Number> = new Set<Number>();

  let preWindowFound,
    postWindowFound: boolean = false;

  for (const attempt of attempts) {
    if (preWindowFound && postWindowFound) {
      break;
    }

    if (!preWindowFound && attempt.questionnaireWindow.id == preWindowId) {
      mainQuestionsBeforeIdSet = getQuestionIdSet(
        await attempt.questionnaireWindow.mainSet.getQuestionOrders()
      );
      preWindowFound = true;
    } else if (
      !postWindowFound &&
      attempt.questionnaireWindow.id == postWindowId
    ) {
      mainQuestionsAfterIdSet = getQuestionIdSet(
        await attempt.questionnaireWindow.mainSet.getQuestionOrders()
      );
      postWindowFound = true;
    }
  }

  return [
    sharedQuestionsIdSet,
    mainQuestionsBeforeIdSet,
    mainQuestionsAfterIdSet,
  ];
}

function processPreAttemptData(
  currAttemptData: AttemptFullData,
  attempt: Attempt,
  sharedSetIds: Set<Number>,
  mainSetBeforeIds: Set<Number>
) {
  const currDatesSubmitted = currAttemptData.dateSubmitted as Date[];
  currDatesSubmitted[0] = attempt.createdAt;

  for (const answer of attempt.answers) {
    const currQuestionId = answer.questionOrder.id;

    const currSharedQnnaireAnswerData = currAttemptData.answers as SharedQnnaireAnswerData;

    if (sharedSetIds.has(currQuestionId)) {
      currSharedQnnaireAnswerData["sharedAnswersBefore"].push(answer.getData());
    } else if (mainSetBeforeIds.has(currQuestionId)) {
      currSharedQnnaireAnswerData["answersBefore"].push(answer.getData());
    }
  }
}

function processPostAttemptData(
  currAttemptData: AttemptFullData,
  attempt: Attempt,
  sharedSetIds: Set<Number>,
  mainSetAfterIds: Set<Number>
) {
  const currDatesSubmitted = currAttemptData.dateSubmitted as Date[];
  currDatesSubmitted[1] = attempt.createdAt;

  for (const answer of attempt.answers) {
    const currQuestionId = answer.questionOrder.id;
    const currSharedQnnaireAnswerData = currAttemptData.answers as SharedQnnaireAnswerData;

    if (sharedSetIds.has(currQuestionId)) {
      currSharedQnnaireAnswerData["sharedAnswersAfter"].push(answer.getData());
    } else if (mainSetAfterIds.has(currQuestionId)) {
      currSharedQnnaireAnswerData["answersAfter"].push(answer.getData());
    }
  }
}

function updateAnswersInAttemptsMap(
  userIdToAttemptDataMap: { [userId: number]: AttemptFullData },
  sharedSetIds: Set<Number>,
  mainSetBeforeIds: Set<Number>,
  mainSetAfterIds: Set<Number>,
  attempt: Attempt,
  preWindowId: number,
  userId: number
) {
  // assume if not pre attempt, it is post attempt
  const isPreAttempt: boolean = attempt.questionnaireWindow.id == preWindowId;
  const currAttemptData: AttemptFullData = userIdToAttemptDataMap[userId];

  if (isPreAttempt) {
    processPreAttemptData(
      currAttemptData,
      attempt,
      sharedSetIds,
      mainSetBeforeIds
    );
  } else {
    processPostAttemptData(
      currAttemptData,
      attempt,
      sharedSetIds,
      mainSetAfterIds
    );
  }
}

/**
 * Gets a list of AttemptFullData that corresponds to the attempts of a given Pre-Post questionnaire
 *
 * @param title The title of the questionnaire
 * @param questionWindows The questionnaire windows of the pre and post questionnaire
 */
export async function getAttemptsForPrePostQnnaire(
  title: string,
  questionWindows: QuestionnaireWindowData[]
): Promise<AttemptFullData[]> {
  // assert pre-post questionnaires have exactly 2 windows
  if (questionWindows.length != 2) {
    throw new Error(`Pre-Post Qnnaire should have only two windows.`);
  }

  const preWindowId = questionWindows[0].windowId;
  const postWindowId = questionWindows[1].windowId;

  const attempts = await getRepository(Attempt).find({
    where: { questionnaireWindow: { id: In([preWindowId, postWindowId]) } },
    relations: [
      "user",
      "answers",
      "answers.questionOrder",
      "questionnaireWindow",
      "questionnaireWindow.mainSet",
      "questionnaireWindow.sharedSet",
    ],
  });

  const mainQuestionIdSets: Set<Number>[] = await populateQuestionIdSets(
    preWindowId,
    postWindowId,
    attempts
  );
  const sharedSetIds: Set<Number> = mainQuestionIdSets[0];
  const mainSetBeforeIds: Set<Number> = mainQuestionIdSets[1];
  const mainSetAfterIds: Set<Number> = mainQuestionIdSets[2];

  // create a dictionary that maps userIds to the AttemptFullData
  const userIdToAttemptDataMap: { [userId: number]: AttemptFullData } = {};
  let dummyInvalidDate: Date = new Date();
  dummyInvalidDate.setFullYear(dummyInvalidDate.getFullYear() + 10);

  for (const attempt of attempts) {
    const userId = attempt.user.id;
    const emptySharedQnnaireAnswersData: SharedQnnaireAnswerData = {
      answersAfter: [],
      answersBefore: [],
      sharedAnswersBefore: [],
      sharedAnswersAfter: [],
    };

    // ensure dictionary has a valid key entry
    if (!userIdToAttemptDataMap[userId]) {
      userIdToAttemptDataMap[userId] = {
        user: attempt.user.getData(),
        title,
        dateSubmitted: [dummyInvalidDate, dummyInvalidDate],
        type: QuestionnaireType.PRE_POST,
        questionnaireWindow: questionWindows,
        // initialise answers to empty list
        answers: emptySharedQnnaireAnswersData,
      };
    }

    updateAnswersInAttemptsMap(
      userIdToAttemptDataMap,
      sharedSetIds,
      mainSetBeforeIds,
      mainSetAfterIds,
      attempt,
      preWindowId,
      userId
    );
  }

  const allAttempts: AttemptFullData[] = [];

  Object.entries(userIdToAttemptDataMap).forEach(([userId, attemptFullData]) =>
    allAttempts.push(attemptFullData)
  );

  return allAttempts;
}

/**
 * Gets a list of AttemptFullData that corresponds to the attempts of a given one time questionnaire
 * @param title The title of the questionnaire
 * @param questionWindows The questionnaire window
 */
export async function getAttemptsForOneTimeQnnaire(
  title: string,
  questionWindows: QuestionnaireWindowData[]
): Promise<AttemptFullData[]> {
  if (questionWindows.length != 1) {
    throw new Error(`One Time Qnnaire should have only one window.`);
  }

  const { windowId } = questionWindows[0];

  const attempts = await getRepository(Attempt).find({
    where: { questionnaireWindow: { id: windowId } },
    relations: [
      "questionnaireWindow",
      "user",
      "answers",
      "answers.questionOrder",
      "answers.questionOrder.question",
    ],
  });

  const allAttempts: AttemptFullData[] = [];

  for (const attempt of attempts) {
    const attemptData: AttemptFullData = {
      user: attempt.user.getData(),
      title: title,
      type: QuestionnaireType.ONE_TIME,
      dateSubmitted: attempt.createdAt,
      questionnaireWindow: questionWindows[0],
      answers: attempt.answers.map((answer) => answer.getData()),
    };

    allAttempts.push(attemptData);
  }

  return allAttempts;
}
