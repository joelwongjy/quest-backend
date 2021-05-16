import { validate } from "class-validator";
import { flatMap } from "lodash";
import { Person } from "../../entities/user/Person";
import { EntityManager, getRepository, In } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { ClassPerson } from "../../entities/programme/ClassPerson";
import { Programme } from "../../entities/programme/Programme";
import { ClassQuestionnaire } from "../../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../../entities/questionnaire/ProgrammeQuestionnaire";
import { ClassListData, ClassPatchData } from "../../types/classes";
import { ClassPersonRole } from "../../types/classPersons";
import {
  CLASS_EDITOR_ERROR,
  PROGRAMME_CLASS_CREATOR_ERROR,
  PROGRAMME_CLASS_DELETOR_ERROR,
  PROGRAMME_CLASS_EDITOR_ERROR,
} from "../../types/errors";
import {
  ProgrammeData,
  ProgrammeListData,
  ProgrammePatchData,
  ProgrammePostData,
} from "../../types/programmes";

class ProgrammeClassCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PROGRAMME_CLASS_CREATOR_ERROR;
  }
}

class ProgrammeClassDeleterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PROGRAMME_CLASS_DELETOR_ERROR;
  }
}

class ProgrammeClassEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PROGRAMME_CLASS_EDITOR_ERROR;
  }
}

class ClassEditorError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
    this.name = CLASS_EDITOR_ERROR;
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
        classCount: p.classes.filter((p) => !p.discardedAt).length,
        description: p.description ?? undefined,
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
    const { name, description } = createData;

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
    return programme;
  }

  public static async verify(
    id: number,
    createData: ProgrammePostData
  ): Promise<boolean> {
    const query = await getRepository(Programme).findOne({
      where: { id },
      relations: ["classes"],
    });

    if (!query) {
      return false;
    }

    return true;
  }
}

export class ProgrammeClassDeleter {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async deleteProgramme(id: number) {
    const programme = await this.manager
      .getRepository(Programme)
      .findOneOrFail({
        select: ["id"],
        where: { id },
        relations: ["programmeQuestionnaires", "classes"],
      });

    const { programmeQuestionnaires, classes } = programme;

    await this._deleteProgramme(programme);
    await this._deleteProgrammeQuestionnaires(programmeQuestionnaires);

    const classDeletor = new ClassDeletor(this.manager);
    await classDeletor.deleteClasses(classes);
  }

  private async _deleteProgramme(programme: Programme): Promise<void> {
    await this.manager.getRepository(Programme).softRemove(programme);
  }

  private async _deleteProgrammeQuestionnaires(
    pqnnaire: ProgrammeQuestionnaire[]
  ): Promise<void> {
    await this.manager
      .getRepository(ProgrammeQuestionnaire)
      .softRemove(pqnnaire);
  }

  public static async verify(id: number): Promise<boolean> {
    const programme = await getRepository(Programme).findOneOrFail({
      select: ["id", "discardedAt"],
      where: { id },
      withDeleted: true,
      relations: [
        "programmeQuestionnaires",
        "classes",
        "classes.classQuestionnaires",
        "classes.classPersons",
      ],
    });

    const classQuestionnaires: ClassQuestionnaire[] = flatMap(
      programme.classes.map((c) => c.classQuestionnaires)
    );
    const classPersons: ClassPerson[] = flatMap(
      programme.classes.map((c) => c.classPersons)
    );

    const isProgrammeDeleted = !!programme.discardedAt;
    const areProgrammeQnnairesDeleted =
      programme.programmeQuestionnaires.filter(
        (pqnnaire) => !pqnnaire.discardedAt
      ).length === 0;

    const areClassesDeleted =
      programme.classes.filter((c) => !c.discardedAt).length === 0;
    const areClassQnnairesDeleted =
      classQuestionnaires.filter((cqnnaire) => !cqnnaire.discardedAt).length ===
      0;
    const areClassPersonsDeleted =
      classPersons.filter((cp) => !cp.discardedAt).length === 0;

    return (
      isProgrammeDeleted &&
      areProgrammeQnnairesDeleted &&
      areClassesDeleted &&
      areClassQnnairesDeleted &&
      areClassPersonsDeleted
    );
  }
}

export class ClassDeletor {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async deleteClasses(classes: Class[]): Promise<Class[]> {
    if (classes.length === 0) {
      return [];
    }

    const classesOR = classes.map((c) => {
      return { id: c.id };
    });
    const queryClasses = await this.manager.getRepository(Class).find({
      where: classesOR,
      relations: ["classQuestionnaires", "classPersons"],
      withDeleted: true,
    });

    const classQnnaires = flatMap(
      queryClasses.map((c) => c.classQuestionnaires)
    );
    const classPersons = flatMap(queryClasses.map((c) => c.classPersons));

    const result = await this._deleteClasses(queryClasses);
    await this._deleteClassQuestionnaires(classQnnaires);
    await this._deleteClassPersons(classPersons);

    return result;
  }

  private async _deleteClasses(classes: Class[]): Promise<Class[]> {
    return await this.manager.getRepository(Class).softRemove(classes);
  }

  private async _deleteClassQuestionnaires(
    cqnnaire: ClassQuestionnaire[]
  ): Promise<ClassQuestionnaire[]> {
    return await this.manager
      .getRepository(ClassQuestionnaire)
      .softRemove(cqnnaire);
  }

  private async _deleteClassPersons(
    classPersons: ClassPerson[]
  ): Promise<ClassPerson[]> {
    return await this.manager
      .getRepository(ClassPerson)
      .softRemove(classPersons);
  }
}

export class ProgrammeClassEditor {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async editProgramme(
    id: string,
    editData: ProgrammePatchData
  ): Promise<Programme> {
    const query = await this.manager.getRepository(Programme).findOneOrFail({
      select: ["id"],
      where: { id },
      relations: ["classes"],
    });

    const { name, description, classes } = editData;
    let programme: Programme;
    programme = await this.editProgrammeAttributes(query, name, description);

    if (classes) {
      programme = await this.editAssociatedClasses(query, {
        classes,
      });
    }

    return programme;
  }

  private async editProgrammeAttributes(
    programme: Programme,
    name?: string,
    description?: string
  ): Promise<Programme> {
    if (!name && !description) {
      return programme;
    }

    if (name) {
      programme.name = name;
    }
    if (description) {
      programme.description = description;
    }

    await this.manager.getRepository(Programme).save(programme);
    return programme;
  }

  private async editAssociatedClasses(
    programme: Programme,
    editData: Required<Pick<ProgrammePatchData, "classes">>
  ): Promise<Programme> {
    const { classes: existingClasses } = programme;

    const classesToDelete: Map<number, Class> = new Map();
    existingClasses.forEach((c) => {
      classesToDelete.set(c.id, c);
    });

    const toKeep: Class[] = [];
    const toCreate: Class[] = [];
    const toSoftDelete: Class[] = [];

    editData.classes.forEach((c) => {
      if (c.id && classesToDelete.has(c.id)) {
        const classInMap = classesToDelete.get(c.id)!;
        toKeep.push(classInMap);
        classesToDelete.delete(c.id);
        return;
      }

      const { name, description } = c;
      if (!name) {
        throw new ProgrammeClassEditorError(
          `Could not associate new class as no class name was given`
        );
      }
      toCreate.push(new Class(name, programme, description));
    });

    classesToDelete.forEach((c) => {
      toSoftDelete.push(c);
    });

    const keptClasses = await this.keepClasses(toKeep);
    const createdClasses = await this.createClasses(toCreate);
    const deletedClasses = await this.deleteClasses(toSoftDelete);
    const associatedClasses: Class[] = [
      ...keptClasses,
      ...createdClasses,
      ...deletedClasses,
    ];

    if (associatedClasses.length < programme.classes.length) {
      throw new ProgrammeClassEditorError(
        `Edit operation will cause dangling classes`
      );
    }

    programme.classes = associatedClasses; // Risky operation
    await this.manager.getRepository(Programme).save(programme);
    return programme;
  }

  private async createClasses(classes: Class[]): Promise<Class[]> {
    await Promise.all(
      classes.map(async (c) => {
        const errors = await validate(c);
        if (errors.length > 0) {
          throw new ProgrammeClassEditorError(
            `${c} failed validation checks ` +
              `(failed properties: ${errors.map((e) => e.property)})`
          );
        }
      })
    );

    const newClasses = await this.manager.getRepository(Class).save(classes);
    return newClasses;
  }

  private async deleteClasses(classes: Class[]): Promise<Class[]> {
    const deletor = new ClassDeletor(this.manager);
    return await deletor.deleteClasses(classes);
  }

  private async keepClasses(classes: Class[]): Promise<Class[]> {
    const toRestore: Class[] = [];
    const toKeep: Class[] = [];

    classes.forEach((c) => {
      if (c.discardedAt) {
        toRestore.push(c);
      } else {
        toKeep.push(c);
      }
    });

    const recoveredClasses = await this.manager
      .getRepository(Class)
      .recover(toRestore);
    const result = toKeep.concat(recoveredClasses);

    return result;
  }

  public static async verify(
    id: string | number,
    editData: ProgrammePatchData
  ): Promise<boolean> {
    const programme = await getRepository(Programme).findOne({
      where: { id },
      relations: [
        "classes",
        "classes.classPersons",
        "classes.classQuestionnaires",
      ],
    });
    if (!programme) {
      return false;
    }

    const { name, description, classes: editClasses } = editData;
    if (name && name !== programme.name) {
      return false;
    }
    if (description && description !== programme.description) {
      return false;
    }

    if (!editClasses) {
      // verification has completed
      return true;
    }

    const activeClasses: Class[] = [];
    const discardedClasses: Class[] = [];
    programme.classes.forEach((c) => {
      if (c.discardedAt) {
        discardedClasses.push(c);
      } else {
        activeClasses.push(c);
      }
    });

    if (activeClasses.length !== editClasses.length) {
      return false;
    }

    // check activeClasses
    const activeClassPersons: ClassPerson[] = flatMap(
      activeClasses.map((c) => c.classPersons)
    );
    const activeClassQnnaires: ClassQuestionnaire[] = flatMap(
      activeClasses.map((c) => c.classQuestionnaires)
    );
    const areActiveClassPersonsActive =
      activeClassPersons.filter((cp) => cp.discardedAt).length === 0;
    const areActiveClassQnnairesActive =
      activeClassQnnaires.filter((cq) => cq.discardedAt).length === 0;

    // check discardedClasses
    const discardedClassPersons: ClassPerson[] = flatMap(
      discardedClasses.map((c) => c.classPersons)
    );
    const discardedClassQnnaires: ClassQuestionnaire[] = flatMap(
      discardedClasses.map((c) => c.classQuestionnaires)
    );
    const areDiscardedClassPersonsDiscarded =
      discardedClassPersons.filter((cp) => !cp.discardedAt).length === 0;
    const areDiscardedClassQnnairesDiscarded =
      discardedClassQnnaires.filter((cq) => !cq.discardedAt).length === 0;

    return (
      areActiveClassPersonsActive &&
      areActiveClassQnnairesActive &&
      areDiscardedClassPersonsDiscarded &&
      areDiscardedClassQnnairesDiscarded
    );
  }
}

export class ClassEditor {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async editClass(id: number, editData: ClassPatchData): Promise<Class> {
    const clazz = await this.manager.getRepository(Class).findOne({
      where: { id },
      relations: ["classPersons", "classPersons.person"],
    });

    if (!clazz) {
      throw new ClassEditorError(`No class found for id ${id}`);
    }

    const { name, studentIds, teacherIds } = editData;

    if (name) {
      clazz.name = name;
    }

    const studentMap: Map<number, ClassPerson> = new Map();
    const teacherMap: Map<number, ClassPerson> = new Map();
    clazz.classPersons.forEach((cp) => {
      if (cp.role === ClassPersonRole.STUDENT) {
        studentMap.set(cp.person.id, cp);
      } else if (cp.role === ClassPersonRole.TEACHER) {
        teacherMap.set(cp.person.id, cp);
      }
    });

    const toKeep: ClassPerson[] = [];
    const toRemove: ClassPerson[] = [];
    let toCreate: ClassPerson[] = [];

    // students
    const newStudentIds: number[] = [];
    studentIds.forEach((id) => {
      if (studentMap.has(id)) {
        const cp = studentMap.get(id)!;
        cp.discardedAt = null;
        toKeep.push(cp);
        studentMap.delete(id);
      } else {
        newStudentIds.push(id);
      }
    });
    for (const id of studentMap.keys()) {
      toRemove.push(studentMap.get(id)!);
    }
    const students = await this.manager
      .getRepository(Person)
      .findByIds(newStudentIds);
    toCreate = [
      ...toCreate,
      ...students.map(
        (s) => new ClassPerson(clazz, s, ClassPersonRole.STUDENT)
      ),
    ];

    // teachers
    const newTeacherIds: number[] = [];
    teacherIds.forEach((id) => {
      if (teacherMap.has(id)) {
        const cp = teacherMap.get(id)!;
        cp.discardedAt = null;
        toKeep.push(cp);
        teacherMap.delete(id);
      } else {
        newTeacherIds.push(id);
      }
    });
    for (const id of teacherMap.keys()) {
      toRemove.push(teacherMap.get(id)!);
    }
    const teachers = await this.manager
      .getRepository(Person)
      .findByIds(newTeacherIds);
    toCreate = [
      ...toCreate,
      ...teachers.map(
        (t) => new ClassPerson(clazz, t, ClassPersonRole.TEACHER)
      ),
    ];

    // save
    await this.manager.getRepository(ClassPerson).save(toKeep);
    await this.manager.getRepository(ClassPerson).softRemove(toRemove);
    await this.manager.getRepository(ClassPerson).save(toCreate);

    const prevNumber = clazz.classPersons.length;
    clazz.classPersons = [...toKeep, ...toRemove, ...toCreate];
    if (clazz.classPersons.length < prevNumber) {
      throw new ClassEditorError(
        `Implementation bug: will cause dangling ClassPerson`
      );
    }
    await this.manager.getRepository(Class).save(clazz);
    return clazz;
  }
}
