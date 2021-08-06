import { Request, Response } from "express";
import { SuccessId } from "../types/errors";
import { ProgrammeData, ProgrammeListData } from "../types/programmes";
import { ProgrammeClassGetter } from "../services/programme";
import { ProgrammeClassIds } from "../middlewares/findRelevantEntities";

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
