import faker from "faker";
import { Programme } from "../entities/programme/Programme";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import ApiServer from "../server";
import { Class } from "../entities/programme/Class";
import { ClassUser } from "../entities/programme/ClassUser";
import { ClassUserRole } from "../types/classUsers";

faker.seed(127);

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
  public teacher: ClassUser;
  public teacherAccessToken: string;
  public student: ClassUser;
  public studentAccessToken: string;

  // Not instantiated
  // Empty for now

  constructor(
    programme: Programme,
    class_: Class,
    teacher: ClassUser,
    student: ClassUser
  ) {
    this.faker = faker;
    this.programme = programme;
    this.class_ = class_;
    this.teacher = teacher;
    this.teacherAccessToken = `Bearer ${
      teacher.user!.createAuthenticationToken().accessToken
    }`;
    this.student = student;
    this.studentAccessToken = `Bearer ${
      student.user!.createAuthenticationToken().accessToken
    }`;
  }

  public async createClassUser(role: ClassUserRole, class_?: Class) {
    const user = new User(
      faker.internet.userName(),
      faker.name.findName(),
      faker.internet.password(8)
    );
    const classUser = new ClassUser(class_ || this.class_, user, role);
    await getRepository(User).save(user);
    await getRepository(ClassUser).save(classUser);
    const accessToken =
      "Bearer " + user.createAuthenticationToken().accessToken;
    return { classUser, accessToken };
  }
}

export async function loadFixtures(_apiServer: ApiServer): Promise<Fixtures> {
  const programme = new Programme("Study Buddy");
  const class_ = new Class("Class 1", programme);

  const classUsers: ClassUser[] = [];
  const users: User[] = [];

  const teacher = new ClassUser(
    class_,
    new User("admin", "Admin", "setMeUp?"),
    ClassUserRole.TEACHER
  );
  classUsers.push(teacher);
  users.push(teacher.user);

  const student = new ClassUser(
    class_,
    new User("student", "Student", "safeAndSound!"),
    ClassUserRole.STUDENT
  );
  classUsers.push(student);
  users.push(student.user);

  await getRepository(User).save(users);
  await getRepository(Programme).save(programme);
  await getRepository(Class).save(class_);
  await getRepository(ClassUser).save(classUsers);

  return new Fixtures(programme, class_, teacher, student);
}
