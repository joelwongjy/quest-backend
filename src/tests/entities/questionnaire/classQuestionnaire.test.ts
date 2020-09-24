import { Class } from "../../../entities/programme/Class";
import { Programme } from "../../../entities/programme/Programme";
import { ClassQuestionnaire } from "../../../entities/questionnaire/ClassQuestionnaire";
import { Questionnaire } from "../../../entities/questionnaire/Questionnaire";
import { QuestionnaireType } from "../../../types/questionnaires";
import { getRepository } from "typeorm";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Create classQuestionnaire", () => {
  let class_: Class;
  let programme: Programme;
  let questionnaire: Questionnaire;
  let classQuestionnaire: ClassQuestionnaire;

  beforeAll(async () => {
    const programmeData = new Programme("My First Programme!");
    programme = await getRepository(Programme).save(programmeData);

    const classData = new Class("First Program Day 1!", programme);
    class_ = await getRepository(Class).save(classData);

    const questionnaireData = new Questionnaire(
      "Day 1 Review",
      QuestionnaireType.ONE_TIME
    );
    questionnaire = await getRepository(Questionnaire).save(questionnaireData);
  });

  afterAll(async () => {
    await synchronize(server);
  });

  it("create classQuestionnaire", async () => {
    const data = new ClassQuestionnaire(class_, questionnaire);
    classQuestionnaire = await getRepository(ClassQuestionnaire).save(data);

    expect(classQuestionnaire.id).toBeTruthy();
  });

  it("query classQuestionnaire", async () => {
    const classQuestionnaireQuery = await getRepository(
      ClassQuestionnaire
    ).findOne({
      where: { id: classQuestionnaire.id },
      relations: ["class", "questionnaire"],
    });

    expect(classQuestionnaireQuery?.class.name).toBe(class_.name);
    expect(classQuestionnaireQuery?.questionnaire.name).toBe(
      questionnaire.name
    );
  });

  it("query class", async () => {
    const classQuery = await getRepository(Class).findOne({
      where: { id: class_.id },
      relations: [
        "classQuestionnaires",
        "classQuestionnaires.class",
        "classQuestionnaires.questionnaire",
      ],
    });

    expect(classQuery?.classQuestionnaires).toHaveLength(1);

    const relatedItem = classQuery?.classQuestionnaires[0];

    expect(relatedItem?.class.name).toBe(class_.name);
    expect(relatedItem?.questionnaire.name).toBe(questionnaire.name);
  });

  it("query questionnaire", async () => {
    const questionnaireQuery = await getRepository(Questionnaire).findOne({
      where: { id: questionnaire.id },
      relations: [
        "classQuestionnaires",
        "classQuestionnaires.class",
        "classQuestionnaires.questionnaire",
      ],
    });

    expect(questionnaireQuery?.classQuestionnaires).toHaveLength(1);

    const relatedItem = questionnaireQuery?.classQuestionnaires[0];

    expect(relatedItem?.class.name).toBe(class_.name);
    expect(relatedItem?.questionnaire.name).toBe(questionnaire.name);
  });
});
