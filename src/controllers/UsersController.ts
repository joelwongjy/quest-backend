import { compareSync, hashSync } from "bcryptjs";
import { validate, validateOrReject } from "class-validator";
import { Request, Response } from "express";
import { pick } from "lodash";
import { getRepository, IsNull } from "typeorm";
import { PersonData } from "../types/persons";
import { Person } from "../entities/user/Person";
import { User } from "../entities/user/User";
import { AccessTokenSignedPayload } from "../types/tokens";
import { UserPostData } from "../types/users";

export async function create(
  request: Request<{ id: number }, any, UserPostData, any>,
  response: Response
): Promise<void> {
  const { id } = request.params;
  const { username, password, name, defaultUserRole } = request.body;

  const person = await getRepository(Person).findOne(id);

  if (!person) {
    response.sendStatus(404);
    return;
  }

  const user = new User(
    person,
    username,
    name,
    password ?? undefined,
    defaultUserRole
  );
  const errors = await validate(user);
  if (errors.length > 0) {
    let error = "Something went wrong. Please try again!";
    errors.forEach((e) => {
      if (e.property && e.property === "username") {
        error = "Username is either invalid or already exists!";
      }
    });
    response.status(400).json({ error });
    return;
  }
  await getRepository(User).save(user);

  const data = {
    user: user.getData(),
    ...user.createAuthenticationToken(),
  };
  response.status(201).json(data);
}

export async function showSelf(
  _request: Request,
  response: Response<{ user: PersonData }>
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  let user: User;
  try {
    user = await getRepository(User).findOneOrFail(userId, {
      where: { discardedAt: IsNull() },
    });
  } catch (error) {
    response.sendStatus(404);
    return;
  }
  try {
    const data = await user.getPersonData();
    response.status(200).json({ user: data });
  } catch (error) {
    response.sendStatus(400);
  }
}

export async function updateSelf(
  request: Request,
  response: Response
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;
  let user: User;
  try {
    user = await getRepository(User).findOneOrFail(userId, {
      where: { discardedAt: IsNull() },
    });
  } catch (error) {
    response.sendStatus(404);
    return;
  }

  try {
    Object.assign(user, pick(request.body, "name"));
    await getRepository(User).save(user);

    const data = user.getData();
    response.status(200).json({ user: data });
  } catch (error) {
    response.sendStatus(400);
  }
}

export async function changePassword(
  request: Request,
  response: Response
): Promise<void> {
  const payload = response.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  const oldPasswordB64 = request.body.oldPassword;
  const newPasswordB64 = request.body.newPassword;

  if (
    typeof oldPasswordB64 !== "string" ||
    typeof newPasswordB64 !== "string"
  ) {
    response.sendStatus(400);
    return;
  }

  const oldPassword = Buffer.from(oldPasswordB64, "base64").toString();
  const newPassword = Buffer.from(newPasswordB64, "base64").toString();

  const repo = getRepository(User);
  const user = await repo
    .createQueryBuilder("user")
    .addSelect("user.password")
    .where("user.id = :userId", { userId })
    .getOne();

  if (!user || !user.password || !compareSync(oldPassword, user.password)) {
    response.sendStatus(400);
    return;
  }

  try {
    user.password = newPassword;
    await validateOrReject(user);
    await repo.update(userId, { password: hashSync(newPassword) });
    response.sendStatus(204);
  } catch (error) {
    response.sendStatus(400);
  }
}
