import { compareSync } from "bcryptjs";
import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { getRepository } from "typeorm";
import { User } from "../entities/User";
import { isRefreshTokenSignedPayload } from "../types/tokens";

export async function processToken(request: Request, response: Response) {
  try {
    const { authorization } = request.headers;
    if (authorization) {
      const [type, token] = authorization.split(" ");
      if (type !== "Bearer") {
        throw new Error("Invalid input");
      }

      // Try to refresh tokens
      const payload = verify(token, process.env.JWT_SECRET!);

      if (!isRefreshTokenSignedPayload(payload)) {
        throw new Error("Invalid input");
      }
      const { userId } = payload;
      const user = await getRepository(User).findOneOrFail(userId);
      const data = user.createAuthenticationTokens();
      response.status(200).json(data);
    }

    // Try to login using username and password
    const username = request.body.username;
    const password = request.body.password;

    const user = await getRepository(User)
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.username = :username", { username })
      .andWhere("user.discardedAt is null")
      .getOne();

    if (!user || !user.password || !compareSync(password, user.password)) {
      throw new Error();
    }

    const data = user.createAuthenticationTokens();
    response.status(200).json(data);
    return;
  } catch (error) {
    response.sendStatus(400);
  }
}
