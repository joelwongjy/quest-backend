import { Request, Response } from "express";
import { StudentCreator, StudentGetter } from "../services/user/";
import { SuccessId } from "../types/errors";
import { PersonListDataWithProgram, PersonPostData } from "../types/persons";

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
