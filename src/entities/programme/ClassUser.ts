import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "../User";
import { Class } from "./Class";
import { ClassRole } from "./ClassRole";

@Entity()
export class ClassUser extends Discardable {
  entityName = "ClassUser";

  constructor(class_: Class, user: User, role: ClassRole) {
    super();
    this.user = user;
    this.class = class_;
    this.role = role;
  }

  @ManyToOne((type) => User, (user) => user.classUsers)
  user!: User;

  @ManyToOne((type) => Class, (class_) => class_.classUsers)
  class!: Class;

  @Column({
    type: "enum",
    enum: ClassRole,
  })
  role!: ClassRole;
}
