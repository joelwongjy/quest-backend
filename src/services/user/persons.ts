import { parseISO } from "date-fns";
import _ from "lodash";
import { DefaultUserRole } from "../../types/users";
import { EntityManager, getRepository, In, IsNull, Not } from "typeorm";
import { ClassPerson } from "../../entities/programme/ClassPerson";
import { Person } from "../../entities/user/Person";
import { Relationship } from "../../entities/user/Relationship";
import { User } from "../../entities/user/User";
import { ClassPersonRole } from "../../types/classPersons";
import { isValidDate } from "../../types/entities";
import {
  PERSON_CREATOR_ERROR,
  PERSON_DELETER_ERROR,
  PERSON_EDITOR_ERROR,
} from "../../types/errors";
import {
  PersonData,
  PersonPatchData,
  PersonPostData,
} from "../../types/persons";
import { ClassPersonCreator, ProgrammeClassGetter } from "../programme/";

class PersonCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PERSON_CREATOR_ERROR;
  }
}

class PersonEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PERSON_EDITOR_ERROR;
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

    const { name, gender, email, mobileNumber, homeNumber, birthday } =
      createData;
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
  public async queryPersons(
    predicate: (p: Person) => boolean
  ): Promise<Person[]> {
    const query = await getRepository(Person).find({
      relations: [
        "classPersons",
        "classPersons.class",
        "classPersons.class.programme",
        "youths",
        "familyMembers",
        "user",
      ],
      order: {
        name: "ASC",
      },
    });

    const persons: Person[] = [];
    query.forEach((p) => {
      if (predicate(p)) {
        persons.push(p);
      }
    });

    return persons;
  }

  public async getPersons(
    predicate: (p: Person) => boolean
  ): Promise<PersonData[]> {
    const persons = await this.queryPersons(predicate);
    return await Promise.all(persons.map((p) => p.getData()));
  }
}

export class StudentGetter {
  public async getStudents(): Promise<PersonData[]> {
    return await new PersonGetter().getPersons((p) =>
      p.classPersons.map((p) => p.role).includes(ClassPersonRole.STUDENT)
    );
  }
}

export class TeacherGetter {
  public async getTeachers(): Promise<PersonData[]> {
    return await new PersonGetter().getPersons((p) =>
      p.classPersons.map((p) => p.role).includes(ClassPersonRole.TEACHER)
    );
  }
}

export class AdminGetter {
  public async getAdmins(): Promise<PersonData[]> {
    return await new PersonGetter().getPersons(
      (p) =>
        p.user?.defaultRole === DefaultUserRole.ADMIN ||
        p.classPersons.map((p) => p.role).includes(ClassPersonRole.ADMIN)
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

class PersonEditor {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async editPerson(
    id: number,
    editData: PersonPatchData,
    role: ClassPersonRole
  ): Promise<Person> {
    const person = await this.manager.getRepository(Person).findOne({
      where: { id },
      relations: ["classPersons", "classPersons.class"],
    });

    if (!person) {
      throw new PersonEditorError("The given person cannot be found");
    }

    person.name = editData.name ?? person.name;
    person.gender = editData.gender ?? person.gender;
    person.email = editData.email ?? person.email;
    person.mobileNumber = editData.mobileNumber ?? person.mobileNumber;
    person.homeNumber = editData.homeNumber ?? person.homeNumber;

    if (editData.birthday && isValidDate(editData.birthday)) {
      person.birthday = editData.birthday;
    } else if (editData.birthday) {
      const convertToDate = parseISO(editData.birthday);
      if (isValidDate(convertToDate)) {
        person.birthday = convertToDate;
      }
    }

    if (editData.classIds) {
      const classPersons = await this.editClasses(
        person,
        editData.classIds,
        role
      );
      person.classPersons = classPersons;
    }

    await this.manager.getRepository(Person).save(person);
    return person;
  }

  async editClasses(
    person: Person,
    classIds: number[],
    role: ClassPersonRole
  ): Promise<ClassPerson[]> {
    const existingClassIds: number[] = [];

    // list of classPerson ids
    const toKeep: number[] = [];
    const toDiscard: number[] = [];

    person.classPersons.forEach((cp) => {
      if (cp.role !== role) {
        return;
      }
      if (classIds.includes(cp.class.id)) {
        toKeep.push(cp.id);
      } else {
        toDiscard.push(cp.id);
      }

      existingClassIds.push(cp.class.id);
    });

    // list of class ids
    const toCreate: number[] = _.difference(classIds, existingClassIds);

    const createdClassPersons = await new ProgrammeClassGetter()
      .getClasses(toCreate)
      .then((classes) => classes.map((c) => new ClassPerson(c, person, role)));
    const keptClassPersons = await this.manager
      .getRepository(ClassPerson)
      .findByIds(toKeep, { withDeleted: true });
    const discaredClassPersons = await this.manager
      .getRepository(ClassPerson)
      .findByIds(toDiscard, { withDeleted: true });

    return [
      ...(await this.manager
        .getRepository(ClassPerson)
        .recover(keptClassPersons)),
      ...(await this.manager
        .getRepository(ClassPerson)
        .softRemove(discaredClassPersons)),
      ...(await this.manager
        .getRepository(ClassPerson)
        .save(createdClassPersons)),
    ];
  }

  public static async verify(
    id: number,
    editData: PersonPatchData,
    _role: ClassPersonRole
  ): Promise<boolean> {
    const person = await getRepository(Person).findOne({
      where: { id },
      relations: ["classPersons"],
    });

    if (!person) {
      return false;
    }

    const {
      name,
      gender,
      email,
      mobileNumber,
      homeNumber,
      birthday,
      classIds,
    } = editData;

    if (name && person.name !== name) {
      return false;
    }
    if (gender && person.gender !== gender) {
      return false;
    }
    if (email && person.email !== email) {
      return false;
    }
    if (mobileNumber && person.mobileNumber !== mobileNumber) {
      return false;
    }
    if (homeNumber && person.homeNumber !== homeNumber) {
      return false;
    }
    if (birthday) {
      let birthdayDate: Date;
      if (isValidDate(birthday)) {
        birthdayDate = birthday;
      } else {
        birthdayDate = parseISO(birthday);
      }

      if (person.birthday !== birthdayDate) {
        return false;
      }
    }
    if (classIds) {
      const newIds = new Set(classIds);
      if (newIds.size !== person.classPersons.length) {
        return false;
      }
      person.classPersons.forEach((cp) => {
        if (!newIds.has(cp.id)) {
          return false;
        }
      });
    }

    return true;
  }
}

export class StudentTeacherAdminEditor {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  public async editStudent(
    id: number,
    editData: PersonPatchData
  ): Promise<Person> {
    const editor = new PersonEditor(this.manager);
    return await editor.editPerson(id, editData, ClassPersonRole.STUDENT);
  }

  public async editTeacher(
    id: number,
    editData: PersonPatchData
  ): Promise<Person> {
    const editor = new PersonEditor(this.manager);
    return await editor.editPerson(id, editData, ClassPersonRole.TEACHER);
  }

  public async editAdmin(
    id: number,
    editData: PersonPatchData
  ): Promise<Person> {
    const editor = new PersonEditor(this.manager);
    return await editor.editPerson(id, editData, ClassPersonRole.ADMIN);
  }
}
