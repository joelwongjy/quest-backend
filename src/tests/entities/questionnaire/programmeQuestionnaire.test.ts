import { Programme } from "../../../entities/programme/Programme";
import { ProgrammeQuestionnaire } from "../../../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import ApiServer from "../../../server";
import { QuestionnaireType } from "../../../types/questionnaires";
import { synchronize } from "../../../utils/tests";
import { getRepository } from "typeorm";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create programmeQuestionnaire", () => {
  let programme: Programme;
  let questionnaire: Questionnaire;
  let programmeQuestionnaire: ProgrammeQuestionnaire;

  beforeAll(async () => {
    const programmeData = new Programme("My Program!");
    programme = await getRepository(Programme).save(programmeData);

    const questionnaireData = new Questionnaire(
      "My Program's Questionnaire!",
      QuestionnaireType.ONE_TIME
    );
    questionnaire = await getRepository(Questionnaire).save(questionnaireData);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create programmeQuestionnaire", async () => {
    const data = new ProgrammeQuestionnaire(programme, questionnaire);
    programmeQuestionnaire = await getRepository(ProgrammeQuestionnaire).save(
      data
    );

    expect(programmeQuestionnaire.id).toBeTruthy();
  });

  it("query programmeQuestionnaire", async () => {
    const programmeQuestionnairequery = await getRepository(
      ProgrammeQuestionnaire
    ).findOne({
      where: { id: programmeQuestionnaire.id },
      relations: ["programme", "questionnaire"],
    });

    expect(programmeQuestionnairequery?.programme.name).toBe(programme.name);
    expect(programmeQuestionnairequery?.questionnaire.name).toBe(
      questionnaire.name
    );
  });

  it("query programme", async () => {
    const programmeQuery = await getRepository(Programme).findOne({
      where: { id: programme.id },
      relations: [
        "programmeQuestionnaires",
        "programmeQuestionnaires.programme",
        "programmeQuestionnaires.questionnaire",
      ],
    });

    expect(programmeQuery?.programmeQuestionnaires).toHaveLength(1);

    const relatedItem = programmeQuery?.programmeQuestionnaires[0];

    expect(relatedItem?.programme.name).toBe(programme.name);
    expect(relatedItem?.questionnaire.name).toBe(questionnaire.name);
  });

  it("query questionnaire", async () => {
    const questionnaireQuery = await getRepository(Questionnaire).findOne({
      where: { id: questionnaire.id },
      relations: [
        "programmeQuestionnaires",
        "programmeQuestionnaires.programme",
        "programmeQuestionnaires.questionnaire",
      ],
    });

    expect(questionnaireQuery?.programmeQuestionnaires).toHaveLength(1);

    const relatedItem = questionnaireQuery?.programmeQuestionnaires[0];

    expect(relatedItem?.programme.name).toBe(programme.name);
    expect(relatedItem?.questionnaire.name).toBe(questionnaire.name);
  });
});
