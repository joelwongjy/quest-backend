import { getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { ClassPerson } from "../../entities/programme/ClassPerson";
import { Person } from "../../entities/user/Person";
import { ClassPersonRole } from "../../types/classPersons";
import { CLASS_PERSON_CREATOR_ERROR } from "../../types/errors";

class ClassPersonCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = CLASS_PERSON_CREATOR_ERROR;
  }
}

export class ClassPersonCreator {
  public async createClassPerson(
    person: Person,
    clazz: Class,
    role: ClassPersonRole
  ): Promise<ClassPerson> {
    this.validateHasIdsOrReject([person], [clazz]);

    const classPerson = await getRepository(ClassPerson).save(
      new ClassPerson(clazz, person, role)
    );
    return classPerson;
  }

  public async assignClassesToPerson(
    person: Person,
    classes: Class[],
    role: ClassPersonRole
  ): Promise<ClassPerson[]> {
    this.validateHasIdsOrReject([person], classes);

    const classPersons = await getRepository(ClassPerson).save(
      classes.map((c) => new ClassPerson(c, person, role))
    );
    return classPersons;
  }

  private validateHasIdsOrReject(persons: Person[], classes: Class[]): void {
    const noIdPersons = persons.filter((p) => !p.id);
    const noIdClasses = classes.filter((c) => !c.id);
    if (noIdPersons.length === 0 || noIdClasses.length === 0) {
      throw new ClassPersonCreatorError(
        `One or more provided persons/classes have no ids`
      );
    }
  }
}
