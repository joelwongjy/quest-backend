import { validate } from "class-validator";
import { User } from "../entities/user/User";
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { DefaultUserRole } from "../types/users";

export async function seed(
  _request: Request,
  response: Response
): Promise<void> {
  const superuserResult = await seedSuperuser();

  response.status(200).json({
    "entities seeded": {
      superuser: superuserResult,
    },
  });
}

async function seedSuperuser(): Promise<string> {
  const SUPERUSER = "superuser";
  const SUPERUSER_NAME = "Superuser";
  const SUPERUSER_PASSWORD = "password";

  return await seedUserIfAbsent(
    SUPERUSER,
    SUPERUSER_NAME,
    SUPERUSER_PASSWORD,
    DefaultUserRole.ADMIN
  );
}

async function seedUserIfAbsent(
  username: string,
  name: string,
  password: string,
  defaultRole: DefaultUserRole = DefaultUserRole.GUEST
): Promise<string> {
  const repo = getRepository(User);

  const userCount = await repo.count({
    where: { username: username },
  });
  if (userCount > 0) {
    return `${username} already exists`;
  }

  const user = new User(username, name, password, defaultRole);
  const errors = await validate(user);

  if (errors.length > 0) {
    return `${
      errors.length
    } error(s) while creating user - problems in ${errors.map(
      (e) => e.property
    )}`;
  }

  await repo.save(user);
  return `${username} has been added - password is ${password}`;
}
