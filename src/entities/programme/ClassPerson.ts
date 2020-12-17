import { Column, Entity, getRepository, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Class } from "./Class";
import { ClassUserRole } from "../../types/classUsers";
import { IsEnum, IsNotEmpty } from "class-validator";
import { Person } from "../user/Person";

@Entity()
export class ClassUser extends Discardable {
  entityName = "ClassUser";

  constructor(class_: Class, person: Person, role: ClassUserRole) {
    super();
    this.person = person;
    this.class = class_;
    this.role = role;
  }

  @ManyToOne((type) => Person, (person) => person.classUsers)
  person: Person;

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
