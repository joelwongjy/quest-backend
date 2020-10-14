import { Column, Entity, getRepository, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "../user/User";
import { Class } from "./Class";
import {
  ClassUserData,
  ClassUserListData,
  ClassUserRole,
} from "../../types/classUsers";
import { IsEnum, IsNotEmpty } from "class-validator";

@Entity()
export class ClassUser extends Discardable {
  entityName = "ClassUser";

  constructor(class_: Class, user: User, role: ClassUserRole) {
    super();
    this.user = user;
    this.class = class_;
    this.role = role;
  }

  @Column()
  userId!: number;

  @ManyToOne((type) => User, (user) => user.classUsers)
  user: User;

  @Column()
  classId!: number;

  @ManyToOne((type) => Class, (class_) => class_.classUsers)
  class: Class;

  @Column({
    type: "enum",
    enum: ClassUserRole,
  })
  @IsNotEmpty()
  @IsEnum(ClassUserRole)
  role: ClassUserRole;

  getListData = async (): Promise<ClassUserListData> => {
    const _class =
      this.class || (await getRepository(Class).findOneOrFail(this.classId));
    return {
      ...this.getBase(),
      class: _class.getData(),
      role: this.role,
    };
  };

  getData = async (): Promise<ClassUserData> => ({
    ...(await this.getListData()),
  });
}
