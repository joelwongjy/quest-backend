import { hashSync } from "bcryptjs";
import { IsNotEmpty, IsString, Validate } from "class-validator";
import { sign } from "jsonwebtoken";
import { Column, Entity, OneToMany } from "typeorm";
import IsUniqueUsername from "../constraints/IsUniqueUsername";
import { AuthenticationData } from "../types/auth";
import { BearerTokenType } from "../types/tokens";
import { UserData } from "../types/users";
import { Discardable } from "./Discardable";
import { ClassUser } from "./programme/ClassUser";

@Entity()
export class User extends Discardable {
  entityName = "User";

  constructor(username: string, name: string, password?: string) {
    super();
    this.username = username;
    this.password = password ? hashSync(password) : null;
    this.name = name;
  }

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  @Validate(IsUniqueUsername)
  username: string;

  @Column({ type: "character varying" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ type: "character varying", nullable: true, select: false })
  password: string | null;

  @OneToMany((type) => ClassUser, (classUser) => classUser.user)
  classUsers!: ClassUser[];

  private createBearerToken = (
    tokenType: BearerTokenType,
    expiresIn: string
  ): string => {
    const payload = {
      tokenType,
      userId: this.id,
    };
    const token = sign(payload, process.env.JWT_SECRET!, { expiresIn });
    return token;
  };

  createAuthenticationToken = (): AuthenticationData => {
    const accessToken = this.createBearerToken(
      BearerTokenType.AccessToken,
      "7d"
    );
    return { accessToken };
  };

  getData = (): UserData => ({
    ...this.getBase(),
    username: this.username,
    name: this.name,
  });
}
