import { IsNotEmpty } from "class-validator";
import { Column, Entity, OneToMany } from "typeorm";
import { ProgrammeData, ProgrammeListData } from "../../types/programmes";
import { Discardable } from "../Discardable";
import { ProgrammeQuestionnaire } from "../questionnaire/ProgrammeQuestionnaire";
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

  @OneToMany(
    (type) => ProgrammeQuestionnaire,
    (programmeQuestionnaire) => programmeQuestionnaire.programme
  )
  programmeQuestionnaires!: ProgrammeQuestionnaire[];

  getListData = (): ProgrammeListData => ({
    ...this.getBase(),
    name: this.name,
  });

  getData = (): ProgrammeData => ({
    ...this.getListData(),
  });
}
