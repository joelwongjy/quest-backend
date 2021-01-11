import { parseISO } from "date-fns";
import { getRepository } from "typeorm";
import { ClassPerson } from "../../entities/programme/ClassPerson";
import { Person } from "../../entities/user/Person";
import { ClassPersonRole } from "../../types/classPersons";
import { isValidDate } from "../../types/entities";
import { PERSON_CREATOR_ERROR } from "../../types/errors";
import {
  Gender,
  PersonListDataWithProgram,
  PersonPostData,
} from "../../types/persons";
import { ClassPersonCreator, ProgrammeClassGetter } from "../programme/";

class PersonCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = PERSON_CREATOR_ERROR;
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

export class StudentCreator {
  public async createStudent(
    student: Omit<PersonPostData, "classes">,
    classIds: number[]
  ): Promise<Person> {
    const person = await new PersonCreator().createPerson(student);
    const classes = await new ProgrammeClassGetter().getClasses(classIds);
    const classPersons = await new ClassPersonCreator().assignClassesToPerson(
      person,
      classes,
      ClassPersonRole.STUDENT
    );

    // since person is new, it is save to do this
    person.classPersons = classPersons;
    return person;
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
