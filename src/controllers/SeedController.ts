import { validateOrReject } from "class-validator";
import { User } from "../entities/user/User";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { DefaultUserRole } from "../types/users";
import { Programme } from "../entities/programme/Programme";
import { Class } from "../entities/programme/Class";
import { ClassUserRole } from "../types/classUsers";
import { ClassUser } from "../entities/programme/ClassPerson";
import { Person } from "../entities/user/Person";
import { Gender } from "../types/persons";

const DEFAULT_PASSWORD = "password";

type UserSeed = [string, ClassUserRole];

type ClassUserSeed = {
  name: string;
  users: UserSeed[];
};

type ProgrammeSeed = {
  name: string;
  classes: ClassUserSeed[];
};

const PROGRAMME_SEED: ProgrammeSeed[] = [
  {
    name: "Programme A",
    classes: [
      {
        name: "Class A1",
        users: [
          ["A1-Teacher", ClassUserRole.TEACHER],
          ["A1-Student", ClassUserRole.STUDENT],
        ],
      },
      {
        name: "Class A2",
        users: [
          ["A2-Teacher", ClassUserRole.TEACHER],
          ["A2-Student", ClassUserRole.STUDENT],
        ],
      },
    ],
  },
  {
    name: "Programme B",
    classes: [
      {
        name: "Class B1",
        users: [
          ["B1-Teacher", ClassUserRole.TEACHER],
          ["B1-Student", ClassUserRole.STUDENT],
        ],
      },
      {
        name: "Class B2",
        users: [
          ["B2-Teacher", ClassUserRole.TEACHER],
          ["B2-Student", ClassUserRole.STUDENT],
        ],
      },
    ],
  },
  {
    name: "Programme C",
    classes: [
      {
        name: "Class C1",
        users: [
          ["C1-Teacher", ClassUserRole.TEACHER],
          ["C1-Student", ClassUserRole.STUDENT],
        ],
      },
      {
        name: "Class C2",
        users: [
          ["C2-Teacher", ClassUserRole.TEACHER],
          ["C2-Student", ClassUserRole.STUDENT],
        ],
      },
    ],
  },
];

const COMMON_STUDENT: UserSeed = ["XX-Student", ClassUserRole.STUDENT];

export async function seed(
  _request: Request,
  response: Response
): Promise<void> {
  try {
    const superuser = new User(
      "superuser",
      "superuser",
      DEFAULT_PASSWORD,
      DefaultUserRole.ADMIN
    );
    await seedUserIfAbsent(superuser, new Person("superuser", Gender.FEMALE));
    await seedProgrammesClasses(PROGRAMME_SEED);

    response.status(200).json({
      message: "done",
    });
  } catch (error) {
    response.status(400).json({
      error,
    });
  }
}

async function seedUserIfAbsent(user: User, person: Person): Promise<Person> {
  const userRepo = getRepository(User);
  const personRepo = getRepository(Person);

  const { username } = user;

  // return if username already exists
  const findPerson = await personRepo.findOne({
    where: { user: { username: username } },
  });
  if (findPerson) {
    return findPerson;
  }

  // create new user
  await validateOrReject(person);
  await validateOrReject(user);
  const seededPerson = await personRepo.save(person);
  const seededUser = await userRepo.save(user);
  seededPerson.user = seededUser;
  await personRepo.save(seededPerson);
  return seededPerson;
}

async function seedProgrammesClasses(seed: ProgrammeSeed[]): Promise<void> {
  const programmeRepo = getRepository(Programme);
  const classRepo = getRepository(Class);
  const classUserRepo = getRepository(ClassUser);

  const seededClasses = await Promise.all(
    seed.map(async (seed) => {
      const { name, classes } = seed;

      // return if programme already exists
      const programmeCount = await programmeRepo.count({
        where: { name: name },
      });
      if (programmeCount > 0) {
        return;
      }

      // save the programme
      const programme = new Programme(name);
      await validateOrReject(programme);
      const seededProgramme = await programmeRepo.save(programme);

      // save all classes
      return await Promise.all(
        classes.map(async (classTemplate) => {
          const { name, users } = classTemplate;

          const class_ = new Class(name, seededProgramme);
          await validateOrReject(class_);
          const seededClass = await classRepo.save(class_);
          await seedClassWithUsers(seededClass, users);
          return seededClass;
        })
      );
    })
  );

  // add a common student to all classes
  const commonStudentName = COMMON_STUDENT[0];
  const commonStudent = await seedUserIfAbsent(
    new User(commonStudentName, commonStudentName, DEFAULT_PASSWORD),
    new Person(commonStudentName, Gender.FEMALE)
  );
  await Promise.all(
    seededClasses.map(async (classes) => {
      classes?.map(async (class_) => {
        const classUserData = new ClassUser(
          class_,
          commonStudent,
          COMMON_STUDENT[1]
        );

        await classUserRepo.save(classUserData);
      });
    })
  );
}

async function seedClassWithUsers(
  class_: Class,
  users: UserSeed[]
): Promise<void> {
  const classUserRepo = getRepository(ClassUser);

  await Promise.all(
    users.map(async (userTuple) => {
      const name = userTuple[0];
      const user = await seedUserIfAbsent(
        new User(name, name, DEFAULT_PASSWORD),
        new Person(name, Gender.MALE)
      );

      const classUser = new ClassUser(class_, user, userTuple[1]);
      await classUserRepo.save(classUser);
    })
  );
}
