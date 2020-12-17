import { IsNotEmpty } from "class-validator";
import { ClassPersonRole } from "../../types/classPersons";
import { Column, Entity, getRepository, ManyToOne, OneToMany } from "typeorm";
import { ClassData, ClassListData } from "../../types/classes";
import { Discardable } from "../Discardable";
import { ClassQuestionnaire } from "../questionnaire/ClassQuestionnaire";
import { ClassPerson } from "./ClassPerson";
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

  @OneToMany((type) => ClassPerson, (classUser) => classUser.class)
  classPersons!: ClassPerson[];

  @OneToMany(
    (type) => ClassQuestionnaire,
    (classQuestionnaire) => classQuestionnaire.class
  )
  classQuestionnaires!: ClassQuestionnaire[];

  private getStudentsAndTeachers = async (): Promise<{
    students: ClassPerson[];
    teachers: ClassPerson[];
  }> => {
    const classPersons =
      this.classPersons ||
      (
        await getRepository(Class).findOneOrFail({
          where: { id: this.id },
          relations: ["classPersons", "classPersons.person"],
        })
      ).classPersons;
    return {
      students: classPersons.filter(
        (cu) => cu.role === ClassPersonRole.STUDENT
      ),
      teachers: classPersons.filter(
        (cu) => cu.role === ClassPersonRole.TEACHER
      ),
    };
  };

  getListData = async (): Promise<ClassListData> => {
    const members = await this.getStudentsAndTeachers();

    return {
      ...this.getBase(),
      name: this.name,
      studentCount: members.students.length,
      teacherCount: members.teachers.length,
    };
  };

  getData = async (): Promise<ClassData> => {
    const programme =
      this.programme ||
      (
        await getRepository(Class).findOneOrFail({
          where: { id: this.id },
          relations: ["programme"],
        })
      ).programme;
    const members = await this.getStudentsAndTeachers();
    return {
      ...(await this.getListData()),
      programmeId: programme.id,
      programmeName: programme.name,
      students: members.students.map((s) => s.person.getListData()),
      teachers: members.teachers.map((s) => s.person.getListData()),
    };
  };
}
