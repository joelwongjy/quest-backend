import { hashSync } from "bcryptjs";
import { IsEnum, IsNotEmpty, IsString, Validate } from "class-validator";
import { sign } from "jsonwebtoken";
import { Column, Entity, getRepository, JoinColumn, OneToOne } from "typeorm";
import _ from "lodash";
import IsUniqueUsername from "../../constraints/IsUniqueUsername";
import { AuthenticationData } from "../../types/auth";
import { BearerTokenType } from "../../types/tokens";
import { DefaultUserRole, UserListData, UserData } from "../../types/users";
import { Discardable } from "../Discardable";
import { Person } from "./Person";
import { PersonData } from "../../types/persons";

@Entity()
export class User extends Discardable {
  entityName = "User";

  constructor(
    person: Person,
    username: string,
    name: string,
    password?: string,
    defaultRole?: DefaultUserRole
  ) {
    super();
    this.person = person;
    this.username = username;
    this.password = password ? hashSync(password) : null;
    this.defaultRole = defaultRole ?? DefaultUserRole.USER;
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

  @Column({
    type: "enum",
    enum: DefaultUserRole,
    default: DefaultUserRole.USER,
  })
  @IsEnum(DefaultUserRole)
  defaultRole: DefaultUserRole;

  @OneToOne((type) => Person, (person) => person.user, { nullable: false })
  @JoinColumn()
  person: Person;

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

  getListData = (): UserListData => ({
    ...this.getBase(),
    username: this.username,
    name: this.name,
    appRole: this.defaultRole,
  });

  getData = (): UserData => {
    return this.getListData();
  };

  getPersonData = async (): Promise<PersonData> => {
    const person =
      this.person ||
      (
        await getRepository(User).findOneOrFail({
          where: { id: this.id },
          relations: ["person"],
        })
      ).person;

    return await person.getData();
  };
}
