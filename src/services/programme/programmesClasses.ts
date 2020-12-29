import { validate } from "class-validator";
import { EntityManager, getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";
import { ClassListData } from "../../types/classes";
import { ClassPersonRole } from "../../types/classPersons";
import { PROGRAMME_CLASS_CREATOR_ERROR } from "../../types/errors";
import {
  ProgrammeData,
  ProgrammeListData,
  ProgrammePostData,
} from "../../types/programmes";

class ProgrammeClassCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PROGRAMME_CLASS_CREATOR_ERROR;
  }
}

export type ProgrammeClass = {
  programmes: Programme[];
  classes: Class[];
};

export class ProgrammeClassGetter {
  public async getProgrammesAndClass(
    programmeIds: number[],
    classIds: number[]
  ): Promise<ProgrammeClass> {
    const programmes =
      programmeIds.length === 0
        ? []
        : await getRepository(Programme).find({
            where: programmeIds.map((id) => {
              return { id };
            }),
          });
    const classes =
      classIds.length === 0
        ? []
        : await getRepository(Class).find({
            where: classIds.map((id) => {
              return { id };
            }),
          });

    return { programmes, classes };
  }

  public async getProgrammes(programmeIds: number[]): Promise<Programme[]> {
    const { programmes } = await this.getProgrammesAndClass(programmeIds, []);
    return programmes;
  }

  public async getClasses(classIds: number[]): Promise<Class[]> {
    const { classes } = await this.getProgrammesAndClass([], classIds);
    return classes;
  }

  public async getProgrammeList(
    programmeIds: number[]
  ): Promise<ProgrammeListData[]> {
    if (programmeIds.length === 0) {
      return [];
    }

    const programmesOR = programmeIds.map((id) => {
      return { id };
    });
    const query = await getRepository(Programme).find({
      where: programmesOR,
      relations: ["classes"],
    });
    const result = query.map((p) => {
      return {
        ...p.getBase(),
        name: p.name,
        classCount: p.classes.length,
      };
    });
    return result;
  }

  public async getProgramme(id: number): Promise<ProgrammeData | undefined> {
    const programme = await getRepository(Programme).findOne({
      where: { id },
      relations: [
        "classes",
        "classes.classPersons",
        "classes.classPersons.person",
      ],
    });

    if (!programme) {
      return undefined;
    }

    const classes: ClassListData[] = [];
    const uniqTeachers: Set<number> = new Set();
    const uniqStudents: Set<number> = new Set();

    programme.classes.forEach((c) => {
      let teacherCount: number = 0;
      let studentCount: number = 0;

      if (c.discardedAt) {
        return;
      }

      c.classPersons.forEach((cp) => {
        if (cp.discardedAt) {
          return;
        }
        switch (cp.role) {
          case ClassPersonRole.TEACHER:
            teacherCount++;
            uniqTeachers.add(cp.person.id);
            break;
          case ClassPersonRole.STUDENT:
            studentCount++;
            uniqStudents.add(cp.person.id);
            break;
          case ClassPersonRole.ADMIN:
            break;
          default:
            break;
        }
      });

      classes.push({
        ...c.getBase(),
        name: c.name,
        teacherCount,
        studentCount,
      });
    });

    const result: ProgrammeData = {
      ...programme.getBase(),
      name: programme.name,
      classes,
      classCount: classes.length,
      teacherCount: uniqTeachers.size,
      studentCount: uniqStudents.size,
    };

    return result;
  }
}

export class ProgrammeClassCreator {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async createProgrammeWithClasses(
    createData: ProgrammePostData
  ): Promise<Programme> {
    const { name, description, classes: classesCreateData } = createData;

    let programme: Programme = new Programme(name, description);
    const errors = await validate(programme);
    if (errors.length > 0) {
      throw new ProgrammeClassCreatorError(
        `Provided programme details (name: ${name}, description: ${description}) ` +
          `failed validation checks (failed properties: ${errors.map(
            (e) => e.property
          )})`
      );
    }

    programme = await this.manager.getRepository(Programme).save(programme);

    if (!classesCreateData || classesCreateData.length === 0) {
      return programme;
    }

    let classes: Class[] = await Promise.all(
      classesCreateData.map(async (c) => {
        const { name, description } = c;
        let clazz = new Class(name, programme, description);

        const errors = await validate(clazz);
        if (errors.length > 0) {
          throw new ProgrammeClassCreatorError(
            `Provided class details (name: ${name}, description: ${description})` +
              `failed validation checks (failed properties: ${errors.map(
                (e) => e.property
              )})`
          );
        }

        return clazz;
      })
    );

    classes = await this.manager.getRepository(Class).save(classes);

    // safe to do this since programme is new
    programme.classes = classes;
    return programme;
  }
}
