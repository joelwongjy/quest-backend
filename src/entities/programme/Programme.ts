import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { Class } from "./Class";

@Entity()
export class Programme extends Discardable {
  entityName = "Programme";

  constructor(name: string) {
    super();
    this.name = name;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @OneToMany((type) => Class, (class_) => class_.programme)
  classes!: Class[];
}
