import { SuccessId } from "../types/errors";
import { ProgrammeListData } from "../types/programmes";
import { Request, Response } from "express";
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
      programmeIds
    );

    response.status(200).json({ programmes });
    return;
  } catch (e) {
    console.log(e);
    response.status(400).json({ success: false });
    return;
  }
}
