import { Request, Response } from "express";
import { getConnection } from "typeorm";
import {
  PersonDeleter,
  StudentCreator,
  StudentGetter,
} from "../services/user/";
import { Message, PERSON_DELETER_ERROR, SuccessId } from "../types/errors";
import {
  PersonDeleteData,
  PersonListDataWithProgram,
  PersonPostData,
} from "../types/persons";

export async function createStudent(
  request: Request<{}, any, PersonPostData, any>,
  response: Response<SuccessId | { error: string }>
): Promise<void> {
  try {
    const { classIds } = request.body;
    const student = await new StudentCreator().createStudent(
      request.body,
      classIds
    );

    response.status(200).json({ success: true, id: student.id });
    return;
  } catch (error) {
    console.log(error);
    response.status(400).json({ error });
    return;
  }
}

export async function indexStudent(
  _request: Request<{}, any, any, any>,
  response: Response<{ persons: PersonListDataWithProgram[] }>
): Promise<void> {
  try {
    const persons = await new StudentGetter().getStudents();
    response.status(200).json({ persons });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function deleteStudent(
  request: Request<{}, any, PersonDeleteData, any>,
  response: Response<SuccessId | Message>
): Promise<void> {
  try {
    await getConnection().transaction<void>(async (manager) => {
      const { persons } = request.body;
      const deleter = new PersonDeleter(manager);

      return await deleter
        .deletePersons(persons)
        .then((_result) => {
          response.status(200).json({ success: true });
          return;
        })
        .catch((error) => {
          console.log(error);
          let message: string | undefined;

          switch (error.name) {
            case PERSON_DELETER_ERROR:
              message = error.message;
              break;
            default:
              message = undefined;
          }

          response.status(400).json({ success: false, message });
          return;
        });
    });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}
