import faker from "faker";
import { Programme } from "../entities/programme/Programme";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import ApiServer from "../server";
import { Class } from "../entities/programme/Class";
import { ClassUser } from "../entities/programme/ClassPerson";
import { ClassUserRole } from "../types/classUsers";
import { DefaultUserRole } from "../types/users";
import { Questionnaire } from "../entities/questionnaire/Questionnaire";
import { QuestionType } from "../types/questions";
import {
  QuestionnaireStatus,
  QuestionnaireType,
  QuestionnaireWindowPostData,
} from "../types/questionnaires";
import {
  OneTimeQuestionnaireCreator,
  PrePostQuestionnaireCreator,
} from "../services/questionnaire";
import { Person } from "../entities/user/Person";
import { Gender } from "../types/persons";

faker.seed(127);

const adminPassword = "theAdminUser";
const teacherPassword = "setMeUp?";
const studentPassword = "safeAndSound!";

export async function synchronize(apiServer: ApiServer) {
  if (!apiServer.connection) {
    throw new Error("Connection failed to initialise");
  }
  await apiServer.connection.synchronize(true);
}

export class Fixtures {
  // Other
  faker: Faker.FakerStatic;

  api = "/v1";

  // Instantiated
  public programme: Programme;
  public class_: Class;
  public admin: User;
  public adminAccessToken: string;
  public teacher: ClassUser;
  public teacherAccessToken: string;
  public teacherPassword: string;
  public student: ClassUser;
  public studentAccessToken: string;
  public studentPassword: string;

  // Not instantiated
  // Empty for now

  // readonly data - used to generate the other sample questionnaires
  public shortAnswerQuestionsSet1: Readonly<string[]> = [
    "What is your name?",
    "When is your birthday?",
  ];
  public shortAnswerQuestionsSet2: Readonly<string[]> = [
    "Where is your favourite drink?",
    "What is your favourite food?",
  ];
  public shortAnswerQuestionsSet3: Readonly<string[]> = [
    "Where do you live?",
    "What is your favourite color?",
  ];
  public longAnswerQuestionsSet1: Readonly<string[]> = [
    "Tell us about your dreams!",
  ];
  public moodQuestionsSet1: Readonly<string[]> = [
    "Hello! How are you feeling today?",
  ];
  public moodOptions = ["Great!", "Normal", "Lousy"];
  public scaleAnswerQuestionsSet1: Readonly<string[]> = [
    "Rate your experience from 1 to 5",
  ];
  public scaleOptions = ["1", "2", "3", "4", "5"];
  public mcqQuestion1: Readonly<string> = "Which of these options do you like?";
  public mcqQuestion1Options: Readonly<string[]> = [
    "Option A",
    "Option B",
    "Option C",
  ];

  public sampleWindow1: Readonly<QuestionnaireWindowPostData> = {
    startAt: new Date("2020/01/01"),
    endAt: new Date("2020/01/15"),
    questions: this.shortAnswerQuestionsSet1.map((questionText, order) => {
      return {
        order,
        questionType: QuestionType.SHORT_ANSWER,
        questionText,
      };
    }),
  };
  public sampleWindow2: Readonly<QuestionnaireWindowPostData> = {
    startAt: new Date("2020/03/01"),
    endAt: new Date("2020/03/15"),
    questions: this.shortAnswerQuestionsSet2.map((questionText, order) => {
      return {
        order,
        questionType: QuestionType.SHORT_ANSWER,
        questionText,
      };
    }),
  };
  public sampleWindow3: Readonly<QuestionnaireWindowPostData> = {
    startAt: new Date("2020/05/01"),
    endAt: new Date("2020/05/15"),
    questions: this.shortAnswerQuestionsSet3.map((questionText, order) => {
      return {
        order,
        questionType: QuestionType.SHORT_ANSWER,
        questionText,
      };
    }),
  };

  constructor(
    programme: Programme,
    class_: Class,
    admin: User,
    teacher: ClassUser,
    student: ClassUser
  ) {
    this.faker = faker;
    this.programme = programme;
    this.admin = admin;
    this.adminAccessToken = `Bearer ${
      admin.createAuthenticationToken().accessToken
    }`;
    this.class_ = class_;
    this.teacher = teacher;
    this.teacherAccessToken = `Bearer ${
      teacher.person.user!.createAuthenticationToken().accessToken
    }`;
    this.teacherPassword = teacherPassword;
    this.student = student;
    this.studentAccessToken = `Bearer ${
      student.person.user!.createAuthenticationToken().accessToken
    }`;
    this.studentPassword = studentPassword;
  }

  public async createClassUser(role: ClassUserRole, class_?: Class) {
    const name = faker.name.findName();
    const person = new Person(name, Gender.MALE);
    const user = new User(
      name,
      faker.internet.userName(),
      faker.internet.password(8)
    );
    person.user = user;
    const classUser = new ClassUser(class_ || this.class_, person, role);

    await getRepository(User).save(user);
    await getRepository(Person).save(person);
    await getRepository(ClassUser).save(classUser);
    const accessToken =
      "Bearer " + user.createAuthenticationToken().accessToken;
    return { classUser, accessToken };
  }

  public async createSampleOneTimeQuestionnaire() {
    const creator = new OneTimeQuestionnaireCreator({
      title: "Sample One-Time Questionnaire",
      type: QuestionnaireType.ONE_TIME,
      status: QuestionnaireStatus.DRAFT,
      questionWindows: [this.sampleWindow1],
      sharedQuestions: {
        questions: [],
      },
      classes: [],
      programmes: [],
    });
    const result: Questionnaire = await creator.createQuestionnaire();

    return result;
  }

  public async createSamplePrePostQuestionnaire() {
    const beforeWindow: QuestionnaireWindowPostData = this.sampleWindow1;
    const afterWindow: QuestionnaireWindowPostData = this.sampleWindow2;

    const creator = new PrePostQuestionnaireCreator({
      title: "Sample Before-After Questionnaire",
      type: QuestionnaireType.PRE_POST,
      status: QuestionnaireStatus.DRAFT,
      questionWindows: [beforeWindow, afterWindow],
      sharedQuestions: this.sampleWindow3,
      classes: [],
      programmes: [],
    });
    const result: Questionnaire = await creator.createQuestionnaire();

    return result;
  }
}

export async function loadFixtures(_apiServer: ApiServer): Promise<Fixtures> {
  const programme = new Programme("Study Buddy");
  const class_ = new Class("Class 1", programme);

  const classUsers: ClassUser[] = [];
  const persons: Person[] = [];
  const users: User[] = [];

  const admin = new User(
    "admin",
    "Admin",
    adminPassword,
    DefaultUserRole.ADMIN
  );
  users.push(admin);

  const teacher = new ClassUser(
    class_,
    new Person("Teacher", Gender.FEMALE),
    ClassUserRole.TEACHER
  );
  const teacherUser = new User("teacher", "Teacher", teacherPassword);
  teacher.person.user = teacherUser;
  classUsers.push(teacher);
  persons.push(teacher.person);
  users.push(teacherUser);

  const student = new ClassUser(
    class_,
    new Person("Student", Gender.MALE),
    ClassUserRole.STUDENT
  );
  const studentUser = new User("student", "Student", studentPassword);
  student.person.user = studentUser;
  classUsers.push(student);
  persons.push(student.person);
  users.push(studentUser);

  await getRepository(Person).save(persons);
  await getRepository(User).save(users);
  await getRepository(Programme).save(programme);
  await getRepository(Class).save(class_);
  await getRepository(ClassUser).save(classUsers);

  return new Fixtures(programme, class_, admin, teacher, student);
}
