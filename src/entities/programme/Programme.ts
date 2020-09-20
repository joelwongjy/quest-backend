import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { Class } from "./Class";

@Entity()
export class Programme extends Discardable {
  entityName = "Programme";

  constructor(programme_name: string) {
    super();
    this.programme_name = programme_name;
  }

  @Column()
  @IsNotEmpty()
  programme_name: string;

  @OneToMany((type) => Class, (class_) => class_.programme)
  classes!: Class[];
}
