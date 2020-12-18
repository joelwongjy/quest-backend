import { parseISO } from "date-fns";
import { getRepository } from "typeorm";
import { Person } from "../../entities/user/Person";
import { ClassPersonRole } from "../../types/classPersons";
import { isValidDate } from "../../types/entities";
import { PERSON_CREATOR_ERROR } from "../../types/errors";
import { PersonPostData } from "../../types/persons";
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
}
