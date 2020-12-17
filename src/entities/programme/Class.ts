import { IsNotEmpty } from "class-validator";
import { ClassUserRole } from "../../types/classUsers";
import { Column, Entity, getRepository, ManyToOne, OneToMany } from "typeorm";
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

  private getStudentsAndTeachers = async (): Promise<{
    students: ClassUser[];
    teachers: ClassUser[];
  }> => {
    const classUsers =
      this.classUsers ||
      (
        await getRepository(Class).findOneOrFail({
          where: { id: this.id },
          relations: ["classUsers", "classUsers.user"],
        })
      ).classUsers;
    return {
      students: classUsers.filter((cu) => cu.role === ClassUserRole.STUDENT),
      teachers: classUsers.filter((cu) => cu.role === ClassUserRole.TEACHER),
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
