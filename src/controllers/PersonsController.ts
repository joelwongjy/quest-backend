import { Request, Response } from "express";
import { StudentCreator } from "../services/user/persons";
import { SuccessId } from "../types/errors";
import { PersonPostData } from "../types/persons";

export async function createStudent(
  request: Request<{}, any, PersonPostData, any>,
  response: Response<SuccessId | { error: string }>
): Promise<void> {
  try {
    const { classes } = request.body;
    const student = await new StudentCreator().createStudent(
      request.body,
      classes
    );

    response.status(200).json({ success: true, id: student.id });
    return;
  } catch (error) {
    console.log(error);
    response.status(400).json({ error });
    return;
  }
}
