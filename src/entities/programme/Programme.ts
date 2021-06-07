import { IsNotEmpty, IsOptional } from "class-validator";
import { Column, Entity, getRepository, OneToMany } from "typeorm";
import { ProgrammeData, ProgrammeListData } from "../../types/programmes";
import { Discardable } from "../Discardable";
import { ProgrammeQuestionnaire } from "../questionnaire/ProgrammeQuestionnaire";
import { Announcement } from "./Announcement";
import { Class } from "./Class";

@Entity()
export class Programme extends Discardable {
  entityName = "Programme";

  constructor(name: string, description?: string) {
    super();
    this.name = name;
    this.description = description ?? null;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  description: string | null;

  @OneToMany((type) => Class, (class_) => class_.programme)
  classes!: Class[];

  @OneToMany((type) => Announcement, (announcement) => announcement.class)
  announcements?: Announcement[];

  @OneToMany(
    (type) => ProgrammeQuestionnaire,
    (programmeQuestionnaire) => programmeQuestionnaire.programme
  )
  programmeQuestionnaires!: ProgrammeQuestionnaire[];

  getListData = async (): Promise<ProgrammeListData> => {
    const classCount =
      this.classes?.length ||
      (await getRepository(Class).count({
        where: { programme: { id: this.id } },
      }));
    return {
      ...this.getBase(),
      name: this.name,
      classCount,
    };
  };

  getData = async (): Promise<ProgrammeData> => {
    const classes =
      this.classes ||
      (await getRepository(Class).find({
        where: { programme: { id: this.id } },
      }));
    const classesListData = await Promise.all(
      classes.map((c) => c.getListData())
    );
    const uniqueStudents: number[] = [];
    const uniqueTeachers: number[] = [];
    const classesData = await Promise.all(classes.map((c) => c.getData()));
    classesData.forEach((c) => {
      c.students.forEach((s) => {
        if (uniqueStudents.findIndex((x) => x === s.id) === -1) {
          uniqueStudents.push(s.id);
        }
      });
      c.teachers.forEach((t) => {
        if (uniqueTeachers.findIndex((x) => x === t.id) === -1) {
          uniqueTeachers.push(t.id);
        }
      });
    });
    return {
      ...(await this.getListData()),
      classes: classesListData,
      studentCount: uniqueStudents.length,
      teacherCount: uniqueTeachers.length,
    };
  };
}
