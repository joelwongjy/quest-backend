import { Request, Response } from "express";
import { getRepository, In, SimpleConsoleLogger } from "typeorm";
import { TYPEORM_ENTITYNOTFOUND } from "../types/errors";
import { Class } from "../entities/programme/Class";
import { Announcement } from "../entities/programme/Announcement";
import { Programme } from "../entities/programme/Programme";
import { AnnouncementListData, AnnouncementData } from "../types/announcements";
import { start } from "repl";

export async function create(
  request: Request,
  response: Response
): Promise<void> {
  try {
    let { title, startDate, endDate, programmeIds, classIds, body } =
      request.body;

    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate);
    }

    if (!(endDate instanceof Date)) {
      endDate = new Date(endDate);
    }

    // check for sufficient data to process request
    const isCompleteData = title && startDate && endDate;
    const isThereClassOrProgrammeToTag = programmeIds || classIds;

    if (!isCompleteData || !isThereClassOrProgrammeToTag) {
      throw new Error(
        "Kindly provide a valid title, start date, end date and at least one programme or class to create the announcement for"
      );
    }

    let programmes: Programme[] = [];
    let programmeIdsAdded: number[] = [];
    let classes: Class[] = [];

    // get Programmes first, and all of its classes
    if (programmeIds) {
      programmes = await getRepository(Programme).find({
        where: { id: In(programmeIds) },
        relations: ["classes"],
      });

      for (const program of programmes) {
        programmeIdsAdded.push(program.id);
        for (const class_ of program.classes) {
          // need to check to prevent double counting classes
          if (class_.id in classIds) {
            continue;
          }
          classes.push(class_);
        }
      }
    }

    // get Classes second
    if (classIds) {
      const classesTemp: Class[] = await getRepository(Class).find({
        where: { id: In(classIds) },
        relations: ["programme"],
      });

      for (const class_ of classesTemp) {
        if (class_.programme.id in programmeIdsAdded) {
          programmes.push(class_.programme);
        }
      }

      classes.push(...classesTemp);
    }

    // Assert there is at least 1 programme and 1 class to tag announcement to
    if (programmes.length == 0 || classes.length == 0) {
      throw new Error("Kindly provide valid programmeIds or classIds");
    }

    const announcement: Announcement = new Announcement(
      startDate,
      endDate,
      title,
      programmes,
      classes,
      body
    );

    const announcementData: Announcement = await getRepository(
      Announcement
    ).save(announcement);
    response.status(200).json({ success: true, id: announcementData.id });
    return;
  } catch (error) {
    console.log(error);
    response.status(400).json({ error });
    return;
  }
}

export async function index(
  request: Request,
  response: Response
): Promise<void> {
  try {
    let allAnnouncements: Announcement[] = await getRepository(
      Announcement
    ).find({
      relations: ["classes", "programmes"],
    });

    const result: AnnouncementListData[] = [];

    allAnnouncements.map((announcement) => {
      const programmeData: { id: number; name: string }[] = [];
      const classData: { id: number; name: string }[] = [];

      if (announcement.programmes) {
        announcement.programmes.map((programme) => {
          programmeData.push({
            id: programme.id,
            name: programme.name,
          });
        });
      }

      if (announcement.classes) {
        announcement.classes?.map((class_) => {
          classData.push({
            id: class_.id,
            name: class_.name,
          });
        });
      }

      const currListData: AnnouncementListData = {
        ...announcement.getBase(),
        title: announcement.title,
        startDate: announcement.startDate,
        endDate: announcement.endDate,
        body: announcement.body ?? null,
        programmesData: programmeData,
        classesData: classData,
      };

      result.push(currListData);

      return currListData;
    });

    response.status(200).json({ announcements: result });
    return;
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function show(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      response.status(400);
      return;
    }

    const announcement = await getRepository(Announcement).findOne({
      where: { id: id },
      relations: ["classes", "programmes"],
    });

    if (!announcement) {
      response.sendStatus(404);
      return;
    }

    const programmeData: { id: number; name: string }[] = [];
    const classData: { id: number; name: string }[] = [];

    announcement.programmes?.map((programme) => {
      programmeData.push({
        id: programme.id,
        name: programme.name,
      });
    });

    announcement.classes?.map((class_) => {
      classData.push({
        id: class_.id,
        name: class_.name,
      });
    });

    const result: AnnouncementData = {
      ...announcement.getBase(),
      title: announcement.title,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      body: announcement.body ?? null,
      programmesData: programmeData,
      classesData: classData,
    };

    response.status(200).json({
      announcement: result,
    });
    return;
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}

export async function softDelete(
  request: Request,
  response: Response
): Promise<void> {
  const id = parseInt(request.params.id, 10);

  try {
    if (isNaN(id)) {
      response.status(400).json({ success: false });
      return;
    }

    const announcement = await getRepository(Announcement).findOneOrFail({
      where: { id: id },
    });

    await getRepository(Announcement).softRemove(announcement);

    response.status(200).json({ success: true, id: id });
  } catch (error) {
    switch (error.name) {
      case TYPEORM_ENTITYNOTFOUND:
        response.status(404).json({ success: false });
        return;

      default:
        console.log(error);
        response.status(400).json({ success: false });
        return;
    }
  }
}

export async function edit(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      response.status(400);
      return;
    }

    let existingData: Announcement = await getRepository(
      Announcement
    ).findOneOrFail({
      where: { id: id },
    });

    let newTitle: string = request.body.title ?? existingData.title;
    let newStartDate: Date = request.body.startDate ?? existingData.startDate;
    let newEndDate: Date = request.body.endDate ?? existingData.endDate;
    let newBody: string | null = request.body.body ?? existingData.body;

    existingData.title = newTitle;
    existingData.startDate = newStartDate;
    existingData.endDate = newEndDate;
    existingData.body = newBody;

    await getRepository(Announcement).save(existingData);

    response.status(200).json({ success: true, id: existingData.id });
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}
