import { validateOrReject } from "class-validator";
import { User } from "../entities/user/User";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { DefaultUserRole } from "../types/users";
import { Programme } from "../entities/programme/Programme";
import { Class } from "../entities/programme/Class";
import { ClassUserRole } from "../types/classUsers";
import { ClassUser } from "../entities/programme/ClassUser";

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

export async function seed(
  _request: Request,
  response: Response
): Promise<void> {
  const superuser = new User(
    "superuser",
    "superuser",
    DEFAULT_PASSWORD,
    DefaultUserRole.ADMIN
  );
  await seedUserIfAbsent(superuser);
  await seedProgrammesClasses(PROGRAMME_SEED);

  response.status(200).json({
    "Programmes, Classes and Users": {
      programmes: PROGRAMME_SEED,
    },
  });
}

async function seedUserIfAbsent(user: User): Promise<User> {
  const repo = getRepository(User);
  const { username } = user;

  // return if username already exists
  const findUser = await repo.findOne({
    where: { username: username },
  });
  if (findUser) {
    return findUser;
  }

  // create new user
  await validateOrReject(user);
  const seededUser = await repo.save(user);

  return seededUser;
}

async function seedProgrammesClasses(
  seed: ProgrammeSeed[]
): Promise<ProgrammeSeed[] | string> {
  const programmeRepo = getRepository(Programme);
  const classRepo = getRepository(Class);

  try {
    await Promise.all(
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
        await Promise.all(
          classes.map(async (classTemplate) => {
            const { name, users } = classTemplate;

            const class_ = new Class(name, seededProgramme);
            await validateOrReject(class_);
            const seededClass = await classRepo.save(class_);
            await seedClassWithUsers(seededClass, users);
          })
        );
      })
    );

    return seed;
  } catch (e) {
    return `Error while seeding Programmes and Classes`;
  }
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
        new User(name, name, DEFAULT_PASSWORD)
      );

      const classUser = new ClassUser(class_, user, userTuple[1]);
      await classUserRepo.save(classUser);
    })
  );
}
