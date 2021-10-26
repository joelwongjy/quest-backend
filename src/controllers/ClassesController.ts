import { Request, Response } from "express";
import { Class } from "../entities/programme/Class";
import { ClassData, ClassPatchData } from "../types/classes";
import { getConnection } from "typeorm";
import { SuccessId } from "../types/errors";
import { ClassEditor } from "../services/programme/programmesClasses";
import { PersonData, PersonPatchData, PersonPostData } from "../types/persons";
import {
  AdminGetter,
  StudentTeacherAdminCreator,
  StudentTeacherAdminEditor,
  TeacherGetter,
} from "../services/user";

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

    const result = await getConnection()
      .transaction<number | ClassData>(async (manager) => {
        const clazz = await manager.getRepository(Class).findOne({
          where: { id: idNum },
          relations: ["programme", "classPersons", "classPersons.person"],
        });

        if (!clazz) {
          return 404;
        } else {
          return await clazz.getData();
        }
      })
      .catch((error) => {
        console.log(error);
        return 400;
      });

    if (result === 400 || result === 404) {
      response.status(result);
      return;
    } else {
      response.status(200).json(result as ClassData);
      return;
    }
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

    const result = await getConnection()
      .transaction<number>(async (manager) => {
        const editor = new ClassEditor(manager);
        await editor.editClass(idNum, request.body);
        return 200;
      })
      .catch((error) => {
        console.log(error);
        return 400;
      });

    if (result === 200) {
      response.status(result).json({ success: true, id: idNum });
      return;
    } else {
      response.status(result);
      return;
    }
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

export async function editTeacher(
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
        await editor.editTeacher(id, request.body);
        return 200;
      })
      .catch((error) => {
        console.log(error);
        return 400;
      });

    if (result === 200) {
      response.status(result).json({ success: true, id });
      return;
    } else {
      response.status(result);
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function editAdmin(
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
        await editor.editAdmin(id, request.body);
        return 200;
      })
      .catch((error) => {
        console.log(error);
        return 400;
      });

    if (result === 200) {
      response.status(200).json({ success: true, id });
      return;
    } else {
      response.status(400);
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function indexTeacher(
  _request: Request<{}, any, any, any>,
  response: Response<{ persons: PersonData[] }>
): Promise<void> {
  try {
    const teachers = await new TeacherGetter().getTeachers();
    response.status(200).json({ persons: teachers });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function indexAdmin(
  _request: Request<{}, any, any, any>,
  response: Response<{ persons: PersonData[] }>
): Promise<void> {
  try {
    const admins = await new AdminGetter().getAdmins();
    response.status(200).json({ persons: admins });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}
