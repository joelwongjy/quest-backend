import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { User } from "../entities/user/User";
import {
  AccessTokenSignedPayload,
  BearerTokenType,
  isAccessTokenSignedPayload,
  isBearerToken,
} from "../types/tokens";
import { DefaultUserRole } from "../types/users";

export const checkBearerToken = (type: BearerTokenType) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const bearerToken = req.headers.authorization;
  if (!bearerToken || !isBearerToken(bearerToken)) {
    res.sendStatus(401);
    return;
  }

  const token = bearerToken.split(" ")[1];

  let payload: object | string;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    res.sendStatus(401);
    return;
  }

  switch (type) {
    case BearerTokenType.AccessToken:
      if (!isAccessTokenSignedPayload(payload)) {
        res.sendStatus(401);
        return;
      }
      break;

    default:
      res.sendStatus(401);
      return;
  }

  res.locals.payload = payload;

  next();
};

export const checkIfAdmin = () => async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = res.locals.payload as AccessTokenSignedPayload;
  const { userId } = payload;

  const user = await getRepository(User).findOne({
    where: { id: userId },
    select: ["id", "defaultRole"],
  });
  if (!user || user.defaultRole != DefaultUserRole.ADMIN) {
    res.sendStatus(401);
    return;
  }

  next();
};
