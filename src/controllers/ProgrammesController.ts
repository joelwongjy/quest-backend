import { Request, Response } from "express";
import { SuccessId } from "../types/errors";
import {
  ProgrammeData,
  ProgrammeListData,
  ProgrammePostData,
} from "../types/programmes";
import {
  ProgrammeClassGetter,
  ProgrammeClassCreator,
  ProgrammeClassDeleter,
} from "../services/programme";
import { ProgrammeClassIds } from "../middlewares/findRelevantEntities";
import { getConnection } from "typeorm";
import { Programme } from "../entities/programme/Programme";

export async function index(
  _request: Request<{}, any, any, any>,
  response: Response<SuccessId | { programmes: ProgrammeListData[] }>
): Promise<void> {
  try {
    const programmeClassIds = response.locals
      .programmeClassIds as ProgrammeClassIds;
    const { programmeIds } = programmeClassIds;
    const programmes = await new ProgrammeClassGetter().getProgrammeList(
      Array.from(programmeIds)
    );

    response.status(200).json({ programmes });
    return;
  } catch (e) {
    console.log(e);
    response.status(400).json({ success: false });
    return;
  }
}

export async function create(
  request: Request<{}, any, ProgrammePostData, any>,
  response: Response<SuccessId>
): Promise<void> {
  try {
    const programme = await getConnection().transaction<Programme>(
      async (manager) => {
        const creator = new ProgrammeClassCreator(manager);
        return await creator.createProgrammeWithClasses(request.body);
      }
    );

    response.status(200).json({ success: true, id: programme.id });
    return;
  } catch (e) {
    console.log(e);
    response.status(400).json({ success: false });
    return;
  }
}

export async function show(
  request: Request<{ id: string }, any, any, any>,
  response: Response<SuccessId | ProgrammeData>
) {
  const { id } = request.params;

  try {
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      response.status(400).json({ success: false });
      return;
    }

    const programmeClassIds = response.locals
      .programmeClassIds as ProgrammeClassIds;
    const { programmeIds } = programmeClassIds;
    if (!programmeIds.has(idInt)) {
      response.status(401).json({ success: false });
      return;
    }

    const programme = await new ProgrammeClassGetter().getProgramme(idInt);
    if (!programme) {
      response.status(404).json({ success: false });
      return;
    }
    response.status(200).json(programme);
    return;
  } catch (e) {
    console.log(e);
    response.status(400).json({ success: false });
    return;
  }
}

export async function softDelete(
  request: Request<{ id: string }, any, any, any>,
  response: Response<SuccessId>
): Promise<void> {
  const { id } = request.params;
  try {
    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      response.status(400).json({ success: false });
      return;
    }

    await getConnection().transaction<void>(async (manager) => {
      const deleter = new ProgrammeClassDeleter(manager);
      await deleter.deleteProgramme(idInt);
    });

    response.status(200).json({ success: true, id: idInt });
    return;
  } catch (e) {
    switch (e.name) {
      // TODO: convert magic literal after Qnnaire deletion bug has been fixed
      case "EntityNotFound":
        response.status(404).json({ success: false });
        return;

      default:
        console.log(e);
        response.status(400).json({ success: false });
        return;
    }
  }
}
