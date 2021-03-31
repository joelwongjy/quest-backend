import { Request, Response } from "express";
import { Class } from "../entities/programme/Class";
import { ClassData, ClassPatchData } from "../types/classes";
import { getConnection } from "typeorm";
import { SuccessId } from "../types/errors";
import { ClassEditor } from "../services/programme/programmesClasses";
import { PersonPostData } from "../types/persons";
import { StudentTeacherAdminCreator } from "../services/user";

export async function show(
  request: Request<{ id: string }, {}, {}, {}>,
  response: Response<ClassData>
): Promise<void> {
  try {
    const { id } = request.params;
    const idNum = parseInt(id);
    if (!idNum) {
      response.status(400);
      return;
    }

    const clazz = await getConnection()
      .transaction<Class | undefined>(async (manager) => {
        return await manager.getRepository(Class).findOne({
          where: { id: idNum },
          relations: ["programme", "classPersons", "classPersons.person"],
        });
      })
      .then(async (clazz) => {
        if (!clazz) {
          response.sendStatus(404);
          return;
        }

        const data = await clazz.getData();
        response.status(200).json(data);
        return;
      })
      .catch((error) => {
        console.log(error);
        response.sendStatus(400);
        return;
      });

    return;
  } catch (error) {
    console.log(error);
    response.status(400);
    return;
  }
}

export async function edit(
  request: Request<{ id: string }, {}, ClassPatchData, {}>,
  response: Response<SuccessId>
): Promise<void> {
  try {
    const { id } = request.params;
    const idNum = parseInt(id);
    if (!idNum) {
      response.status(400);
      return;
    }
    await getConnection()
      .transaction<void>(async (manager) => {
        const editor = new ClassEditor(manager);
        await editor.editClass(idNum, request.body);
        response.status(200).json({ success: true, id: idNum });
        return;
      })
      .catch((error) => {
        console.log(error);
        response.status(400);
        return;
      });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function createTeacher(
  request: Request<{}, any, PersonPostData, any>,
  response: Response<SuccessId | { error: string }>
): Promise<void> {
  try {
    const { classIds } = request.body;
    const teacher = await new StudentTeacherAdminCreator().createTeacher(
      request.body,
      classIds
    );

    response.status(200).json({ success: true, id: teacher.id });
    return;
  } catch (error) {
    console.log(error);
    response.status(400).json({ error: error.message });
    return;
  }
}

export async function createAdmin(
  request: Request<{}, any, PersonPostData, any>,
  response: Response<SuccessId | { error: string }>
): Promise<void> {
  try {
    const { classIds } = request.body;
    const admin = await new StudentTeacherAdminCreator().createAdmin(
      request.body,
      classIds
    );

    response.status(200).json({ success: true, id: admin.id });
    return;
  } catch (error) {
    console.log(error);
    response.status(400).json({ error: error.message });
    return;
  }
}
