import { hashSync } from "bcryptjs";
import { IsEnum, IsNotEmpty, IsString, Validate } from "class-validator";
import { sign } from "jsonwebtoken";
import { Column, Entity, getRepository, OneToMany } from "typeorm";
import _ from "lodash";
import IsUniqueUsername from "../../constraints/IsUniqueUsername";
import { AuthenticationData } from "../../types/auth";
import { BearerTokenType } from "../../types/tokens";
import { ClassUserRole } from "../../types/classUsers";
import { DefaultUserRole, UserListData, UserData } from "../../types/users";
import { Discardable } from "../Discardable";
import { Class } from "../programme/Class";
import { ClassUser } from "../programme/ClassUser";
import { Programme } from "../programme/Programme";

@Entity()
export class User extends Discardable {
  entityName = "User";

  constructor(
    username: string,
    name: string,
    password?: string,
    defaultRole?: DefaultUserRole
  ) {
    super();
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

  getListData = (): UserListData => ({
    ...this.getBase(),
    username: this.username,
    name: this.name,
  });

  getData = async (): Promise<UserData> => {
    // If the user is an admin, return all classes and programmes
    if (this.defaultRole === DefaultUserRole.ADMIN) {
      const allClasses = await getRepository(Class).find();
      const allProgrammes = await getRepository(Programme).find();
      return {
        ...this.getListData(),
        classes: await Promise.all(
          allClasses.map(async (c) => ({
            ...(await c.getData()),
            role: ClassUserRole.ADMIN,
          }))
        ),
        programmes: allProgrammes.map((p) => p.getData()),
      };
    }

    // Else return only those accessible to them
    const classUsers =
      this.classUsers ||
      (
        await getRepository(User).findOneOrFail({
          where: { id: this.id },
          relations: ["classUsers"],
        })
      ).classUsers;
    const programmes = _.uniqBy(
      await Promise.all(
        classUsers.map(async (c) => (await c.getData()).programme)
      ),
      "id"
    );

    return {
      ...this.getListData(),
      classes: await Promise.all(classUsers.map((cu) => cu.getData())),
      programmes,
    };
  };
}