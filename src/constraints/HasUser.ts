import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { getRepository } from "typeorm";
import { Person } from "../entities/Person";

@ValidatorConstraint()
class HasUser implements ValidatorConstraintInterface {
  async validate(_name: string, args: ValidationArguments): Promise<boolean> {
    const person = args.object as Person;

    if (!person.user?.id) {
      // no user or no user.id (i.e. user not saved)
      return true;
    }

    const { id } = person.user;
    const count = await getRepository(Person)
      .createQueryBuilder("person")
      .where("person.user.id = :id", {
        id,
      })
      .getCount();

    return count === 0;
  }

  defaultMessage(_args: ValidationArguments): string {
    return "User is already associated to a person";
  }
}

export default HasUser;
