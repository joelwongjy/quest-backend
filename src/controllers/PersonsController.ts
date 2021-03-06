import { Request, Response } from "express";
import { Person } from "../entities/user/Person";
import { getConnection, getRepository } from "typeorm";
import {
  PersonDeleter,
  StudentTeacherAdminCreator,
  StudentGetter,
  StudentTeacherAdminEditor,
} from "../services/user/";
import { Message, PERSON_DELETER_ERROR, SuccessId } from "../types/errors";
import {
  BulkPersonPostData,
  PersonData,
  PersonDeleteData,
  PersonPatchData,
  PersonPostData,
} from "../types/persons";

export async function createStudent(
  request: Request<{}, any, PersonPostData, any>,
  response: Response<SuccessId | { error: string }>
): Promise<void> {
  try {
    const { classIds } = request.body;
    const student = await new StudentTeacherAdminCreator().createStudent(
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
  response: Response<{ persons: PersonData[] }>
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

export async function editStudent(
  request: Request<{ id: string }, any, PersonPatchData, any>,
  response: Response<SuccessId>
): Promise<void> {
  try {
    const { id: idStr } = request.params;
    const id = parseInt(idStr);

    if (!id) {
      response.status(400);
      return;
    }

    const result = await getConnection()
      .transaction<number>(async (manager) => {
        const editor = new StudentTeacherAdminEditor(manager);
        await editor.editStudent(id, request.body);
        return 200;
      })
      .catch((error) => {
        console.log(error);
        return 400;
      });

    if (result === 200) {
      response.status(200).json({ success: true, id });
      return;
    } else if (result === 400) {
      response.status(400);
      return;
    }
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
    let message: string | undefined;
    const didSucceed = await getConnection().transaction<boolean>(
      async (manager) => {
        const { persons } = request.body;
        const deleter = new PersonDeleter(manager);

        return await deleter
          .deletePersons(persons)
          .then((_result) => {
            return true;
          })
          .catch((error) => {
            console.log(error);

            switch (error.name) {
              case PERSON_DELETER_ERROR:
                message = error.message;
                break;
              default:
                message = undefined;
                break;
            }

            return false;
          });
      }
    );

    if (didSucceed) {
      response.status(200).json({ success: true });
      return;
    } else {
      response.status(400).json({ success: false, message });
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function showPerson(
  request: Request<{ id: string }, any, {}, any>,
  response: Response<{ person: PersonData }>
): Promise<void> {
  try {
    const { id: idStr } = request.params;
    const id = parseInt(idStr);

    if (!id) {
      response.status(400);
      return;
    }

    const person = await getRepository(Person).findOne({
      where: { id: id },
      relations: ["user", "youths", "familyMembers"],
    });

    if (!person) {
      response.sendStatus(404);
      return;
    } else {
      response.status(200).json({ person: await person.getData() });
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function bulkAddStudent(
  request: Request<{}, any, BulkPersonPostData, any>,
  response: Response
): Promise<void> {
  try {
    const { body } = request;
    const { students } = body;
    await Promise.all(
      students.map(async (s) => {
        const { classIds } = s;
        const creator = new StudentTeacherAdminCreator();
        return await creator.createStudent(s, classIds ?? []);
      })
    );
    response.status(200).json({});
    return;
  } catch (e) {
    console.log(e);
    response.status(400).json({});
    return;
  }
}
