import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Programme } from "./Programme";

@Entity()
export class Class extends Discardable {
  entityName = "Class";

  constructor(class_name: string, programme: Programme) {
    super();
    this.class_name = class_name;
    this.programme = programme;
  }

  @Column()
  @IsNotEmpty()
  class_name!: string;

  @ManyToOne((type) => Programme, (programme) => programme.classes)
  programme!: Programme;
}
