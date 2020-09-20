import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "../user/User";
import { Class } from "./Class";
import { ClassUserRole } from "../../types/classUsers";
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

  @ManyToOne((type) => User, (user) => user.classUsers)
  user: User;

  @ManyToOne((type) => Class, (class_) => class_.classUsers)
  class: Class;

  @Column({
    type: "enum",
    enum: ClassUserRole,
  })
  @IsNotEmpty()
  @IsEnum(ClassUserRole)
  role: ClassUserRole;
}
