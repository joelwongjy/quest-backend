import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { ClassData, ClassListData } from "../../types/classes";
import { Discardable } from "../Discardable";
import { ClassQuestionnaire } from "../questionnaire/ClassQuestionnaire";
import { ClassUser } from "./ClassUser";
import { Programme } from "./Programme";

@Entity()
export class Class extends Discardable {
  entityName = "Class";

  constructor(name: string, programme: Programme) {
    super();
    this.name = name;
    this.programme = programme;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @ManyToOne((type) => Programme, (programme) => programme.classes)
  programme: Programme;

  @OneToMany((type) => ClassUser, (classUser) => classUser.class)
  classUsers!: ClassUser[];

  @OneToMany(
    (type) => ClassQuestionnaire,
    (classQuestionnaire) => classQuestionnaire.class
  )
  classQuestionnaires!: ClassQuestionnaire[];

  getListData = (): ClassListData => ({
    ...this.getBase(),
    name: this.name,
  });

  getData = (): ClassData => ({
    ...this.getListData(),
  });
}
