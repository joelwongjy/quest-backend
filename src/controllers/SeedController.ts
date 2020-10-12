import { validateOrReject } from "class-validator";
import { User } from "../entities/user/User";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { DefaultUserRole, UserPostData } from "../types/users";
import { Programme } from "../entities/programme/Programme";
import { Class } from "../entities/programme/Class";

export async function seed(
  _request: Request,
  response: Response
): Promise<void> {
  const SUPERUSER = "superuser";
  const SUPERUSER_NAME = "Superuser";
  const SUPERUSER_PASSWORD = "password";
  const superuserResult = await seedUserIfAbsent(
    SUPERUSER,
    SUPERUSER_NAME,
    SUPERUSER_PASSWORD,
    DefaultUserRole.ADMIN
  );

  const PROGRAMME_SEED = [
    { name: "Programme A", classes: ["Class A1", "Class A2"] },
    { name: "Programme B", classes: ["Class B1", "Class B2"] },
    { name: "Programme C", classes: ["Class C1", "Class C2"] },
  ];
  const programmesClassesResult = await seedProgrammesClasses(PROGRAMME_SEED);

  response.status(200).json({
    "entities seeded": {
      superuser: superuserResult,
      programmes: programmesClassesResult,
    },
  });
}

type ProgrammeSeed = {
  name: string;
  classes: string[];
};

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
        const newProgramme = await programmeRepo.save(programme);

        // initiate all classes
        const classesData = await Promise.all(
          classes.map(async (className) => {
            const class_ = new Class(className, newProgramme);
            await validateOrReject(class_);
            return class_;
          })
        );

        // save all classes
        classRepo.save(classesData);
      })
    );

    return seed;
  } catch (e) {
    return `Error while seeding Programmes and Classes`;
  }
}

type UserSeed = Omit<UserPostData, "name">;

async function seedUserIfAbsent(
  username: string,
  name: string,
  password: string,
  defaultUserRole: DefaultUserRole = DefaultUserRole.GUEST
): Promise<UserSeed | string> {
  const repo = getRepository(User);

  try {
    // return if username already exists
    const userCount = await repo.count({
      where: { username: username },
    });
    if (userCount > 0) {
      return `${username} already exists`;
    }

    // create new user
    const user = new User(username, name, password, defaultUserRole);
    await validateOrReject(user);
    await repo.save(user);

    return { username, password, defaultUserRole };
  } catch (e) {
    return `Error while seeding User ${username}`;
  }
}
