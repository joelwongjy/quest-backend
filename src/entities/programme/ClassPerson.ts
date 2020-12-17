import { Column, Entity, getRepository, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Class } from "./Class";
import { ClassPersonRole } from "../../types/classPersons";
import { IsEnum, IsNotEmpty } from "class-validator";
import { Person } from "../user/Person";

@Entity()
export class ClassPerson extends Discardable {
  entityName = "ClassUser";

  constructor(class_: Class, person: Person, role: ClassPersonRole) {
    super();
    this.person = person;
    this.class = class_;
    this.role = role;
  }

  @ManyToOne((type) => Person, (person) => person.classPersons)
  person: Person;

  @ManyToOne((type) => Class, (class_) => class_.classPersons)
  class: Class;

  @Column({
    type: "enum",
    enum: ClassPersonRole,
  })
  @IsNotEmpty()
  @IsEnum(ClassPersonRole)
  role: ClassPersonRole;
}
