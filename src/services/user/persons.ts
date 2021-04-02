import { parseISO } from "date-fns";
import { EntityManager, getRepository, In, IsNull, Not } from "typeorm";
import { ClassPerson } from "../../entities/programme/ClassPerson";
import { Person } from "../../entities/user/Person";
import { Relationship } from "../../entities/user/Relationship";
import { User } from "../../entities/user/User";
import { ClassPersonRole } from "../../types/classPersons";
import { isValidDate } from "../../types/entities";
import { PERSON_CREATOR_ERROR, PERSON_DELETER_ERROR } from "../../types/errors";
import { PersonListDataWithProgram, PersonPostData } from "../../types/persons";
import { ClassPersonCreator, ProgrammeClassGetter } from "../programme/";

class PersonCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PERSON_CREATOR_ERROR;
  }
}

class PersonDeleterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PERSON_DELETER_ERROR;
  }
}

class PersonCreator {
  public async createPerson(
    createData: Omit<PersonPostData, "classes">
  ): Promise<Person> {
    this.validateHasNameAndGenderOrReject(createData);

    const {
      name,
      gender,
      email,
      mobileNumber,
      homeNumber,
      birthday,
    } = createData;
    const person = new Person(name, gender, email, mobileNumber, homeNumber);

    if (birthday && isValidDate(birthday)) {
      person.birthday = birthday;
    } else if (birthday) {
      const convertToDate = parseISO(birthday);
      if (isValidDate(convertToDate)) {
        person.birthday = convertToDate;
      }
    }

    return await getRepository(Person).save(person);
  }

  public validateHasNameAndGenderOrReject(
    person: Omit<PersonPostData, "classes">
  ): void {
    const { name, gender } = person;
    if (!name || !gender) {
      throw new PersonCreatorError(`Provided data has no name or gender.`);
    }
  }
}

export class StudentTeacherAdminCreator {
  private async _create(
    data: Omit<PersonPostData, "classes">,
    classIds: number[],
    role: ClassPersonRole
  ): Promise<Person> {
    const person = await new PersonCreator().createPerson(data);
    const classes = await new ProgrammeClassGetter().getClasses(classIds);
    const classPersons = await new ClassPersonCreator().assignClassesToPerson(
      person,
      classes,
      role
    );

    // since person is new, it is save to do this
    person.classPersons = classPersons;
    return person;
  }

  public async createStudent(
    student: Omit<PersonPostData, "classes">,
    classIds: number[]
  ): Promise<Person> {
    return await this._create(student, classIds, ClassPersonRole.STUDENT);
  }

  public async createTeacher(
    teacher: Omit<PersonPostData, "classes">,
    classIds: number[]
  ): Promise<Person> {
    return await this._create(teacher, classIds, ClassPersonRole.TEACHER);
  }

  public async createAdmin(
    admin: Omit<PersonPostData, "classes">,
    classIds: number[]
  ): Promise<Person> {
    return await this._create(admin, classIds, ClassPersonRole.ADMIN);
  }

  public static async verify(
    id: number,
    input: PersonPostData
  ): Promise<boolean> {
    const person = await getRepository(Person).findOne({
      where: { id },
      relations: ["classPersons"],
    });

    if (!person) {
      return false;
    }
    if (input.birthday && !person.birthday) {
      return false;
    }

    const { classPersons } = person;
    if (classPersons.length !== input.classIds.length) {
      return false;
    }

    return true;
  }
}

export class PersonGetter {
  public async getPersons(
    predicate: (classPerson: ClassPerson) => boolean
  ): Promise<PersonListDataWithProgram[]> {
    const query = await getRepository(Person).find({
      relations: [
        "classPersons",
        "classPersons.class",
        "classPersons.class.programme",
      ],
    });

    const persons: PersonListDataWithProgram[] = [];

    query.forEach((p) => {
      let shouldInclude: boolean = false;
      const programmes: Pick<PersonListDataWithProgram, "programmes"> = {
        programmes: [],
      };

      p.classPersons.forEach((cp) => {
        if (
          cp.discardedAt ||
          cp.class.discardedAt ||
          cp.class.programme.discardedAt
        ) {
          return;
        }

        if (predicate(cp)) {
          shouldInclude = true;

          const existingProgram = programmes.programmes.find(
            (p) => p.id === cp.class.programme.id
          );

          if (existingProgram) {
            existingProgram.classes.push({
              id: cp.class.id,
              name: cp.class.name,
              role: cp.role,
            });
          } else {
            programmes.programmes.push({
              id: cp.class.programme.id,
              name: cp.class.programme.name,
              classes: [
                {
                  id: cp.class.id,
                  name: cp.class.name,
                  role: cp.role,
                },
              ],
            });
          }
        }
      });

      if (shouldInclude) {
        persons.push({
          ...p.getBase(),
          name: p.name,
          ...programmes,
        });
      }
    });

    return persons;
  }
}

export class StudentGetter {
  public async getStudents(): Promise<PersonListDataWithProgram[]> {
    return await new PersonGetter().getPersons(
      (cp) => cp.role === ClassPersonRole.STUDENT
    );
  }
}

export class PersonDeleter {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async deletePersons(persons: number[]): Promise<boolean> {
    const qryPersons = await this.manager.getRepository(Person).find({
      where: {
        id: In(persons),
      },
      relations: ["user", "classPersons", "youths", "familyMembers"],
    });

    if (qryPersons.length !== persons.length) {
      throw new PersonDeleterError(
        "Could not find one or more persons in the provided list."
      );
    }

    // delete Person
    await this.manager.getRepository(Person).softDelete({
      id: In(persons),
    });

    const users: User[] = [];
    const classPersons: ClassPerson[] = [];
    const relationships: Relationship[] = [];
    qryPersons.forEach((p) => {
      if (p.user) {
        users.push(p.user);
      }

      classPersons.push(...p.classPersons);
      relationships.push(...p.youths, ...p.familyMembers);
    });

    // delete associated
    await this.manager.getRepository(User).softRemove(users);
    await this.manager.getRepository(ClassPerson).softRemove(classPersons);
    await this.manager.getRepository(Relationship).softRemove(relationships);

    return true;
  }

  public static async verify(ids: number[]): Promise<boolean> {
    const persons = await getRepository(Person).find({
      withDeleted: true,
      where: {
        id: In(ids),
        discardedAt: Not(IsNull()),
      },
      relations: ["user", "classPersons", "youths", "familyMembers"],
    });

    if (persons.length !== ids.length) {
      return false;
    }

    for (let p of persons) {
      // check that related ClassPersons are removed
      for (let cp of p.classPersons) {
        if (!cp.discardedAt) {
          return false;
        }
      }

      // check that related User are removed
      if (!p.user!.discardedAt) {
        return false;
      }

      // check that related Relationships are removed
      for (let y of p.youths) {
        if (!y.discardedAt) {
          return false;
        }
      }
      for (let fm of p.familyMembers) {
        if (!fm.discardedAt) {
          return false;
        }
      }
    }

    return true;
  }
}
