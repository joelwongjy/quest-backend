import { Request, Response } from "express";
import { getRepository, In } from "typeorm";
import {
  ENTITY_NOT_FOUND,
  GENERIC_ERROR,
  QuestRes,
  TYPEORM_ENTITYNOTFOUND,
} from "../types/errors";
import { Class } from "../entities/programme/Class";
import { Announcement } from "../entities/programme/Announcement";
import { Programme } from "../entities/programme/Programme";
import {
  AnnouncementListData,
  AnnouncementData,
  AnnouncementPostData,
  AnnouncementPatchData,
} from "../types/announcements";
import { AccessTokenSignedPayload } from "src/types/tokens";
import { User } from "../entities/user/User";
import { DefaultUserRole } from "../types/users";

function convertDateStringToDateObject(date: string | Date) {
  if (!(date instanceof Date)) {
    return new Date(date);
  }

  return date;
}

export async function create(
  request: Request<{}, {}, AnnouncementPostData, {}>,
  response: Response<QuestRes<{}>>
): Promise<void> {
  try {
    let { title, startDate, endDate, programmeIds, classIds, body } =
      request.body;

    // convert date strings to Date objects
    startDate = convertDateStringToDateObject(startDate);
    endDate = convertDateStringToDateObject(endDate);

    // check for sufficient data to process request
    const isCompleteData = title && startDate && endDate;
    const isThereClassOrProgrammeToTag = programmeIds || classIds;

    if (!isCompleteData || !isThereClassOrProgrammeToTag) {
      throw new Error(
        "Kindly provide a valid title, start date, end date and at least one programme or class to create the announcement for"
      );
    }

    // load data of associated programmes and classes
    const { programmes, classes } = await addProgrammesAndClassesData(
      programmeIds,
      classIds
    );

    // assert there is at least 1 programme and 1 class to tag announcement to
    if (programmes.length == 0 || classes.length == 0) {
      throw new Error("Kindly provide valid programmeIds or classIds");
    }

    // create and save new announcement
    const announcement: Announcement = new Announcement(
      startDate,
      endDate,
      title,
      programmes,
      classes,
      body ?? undefined
    );

    const announcementData: Announcement = await getRepository(
      Announcement
    ).save(announcement);

    response
      .status(200)
      .json({ success: true, id: announcementData.id })
      .send();
    return;
  } catch (error) {
    console.log(error);
    response
      .status(400)
      .json({ success: false, message: error.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

async function addProgrammesAndClassesData(
  programmeIds: number[],
  classIds: number[]
) {
  let programmes: Programme[] = [];
  let classes: Class[] = [];
  let programmeIdsAdded: number[] = [];
  let classIdsAdded: number[] = [];

  // get Programmes first, and all of its classes
  if (programmeIds) {
    const programmesTemp: Programme[] = await getRepository(Programme).find({
      where: { id: In(programmeIds) },
      relations: ["classes"],
    });

    for (const program of programmesTemp) {
      programmes.push(program);
      programmeIdsAdded.push(program.id);

      for (const class_ of program.classes) {
        classes.push(class_);
        classIdsAdded.push(class_.id);
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
      if (!programmeIdsAdded.includes(class_.programme.id)) {
        programmes.push(class_.programme);
        programmeIdsAdded.push(class_.programme.id);
      }

      if (!classIdsAdded.includes(class_.id)) {
        classes.push(class_);
        classIdsAdded.push(class_.id);
      }
    }
  }

  return {
    programmes: programmes,
    classes: classes,
  };
}

export async function index(
  _request: Request<{}, {}, {}, {}>,
  response: Response<QuestRes<{ announcements: AnnouncementListData[] }>>
): Promise<void> {
  try {
    const payload = response.locals.payload as AccessTokenSignedPayload;
    const { userId } = payload;
    const user = await getRepository(User).findOne({
      where: { id: userId },
      select: ["id", "defaultRole"],
      relations: [
        "person",
        "person.classPersons",
        "person.classPersons.class",
        "person.classPersons.class.programme",
      ],
    });

    console.log(user?.person.classPersons);

    const isAdmin: boolean = user?.defaultRole == DefaultUserRole.ADMIN;
    const userClassIds: number[] = [];
    const userProgrammeIds: number[] = [];

    if (!isAdmin && user?.person.classPersons) {
      for (const classPerson of user?.person.classPersons) {
        userClassIds.push(classPerson.class.id);
        if (!userProgrammeIds.includes(classPerson.class.programme.id)) {
          userProgrammeIds.push(classPerson.class.programme.id);
        }
      }
    }

    console.log("userClassIds", userClassIds);
    console.log("userProgrammeIds", userProgrammeIds);

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
          if (isAdmin || userProgrammeIds.includes(programme.id)) {
            programmeData.push({
              id: programme.id,
              name: programme.name,
            });
          }
        });
      }

      if (announcement.classes) {
        announcement.classes?.map((class_) => {
          if (isAdmin || userClassIds.includes(class_.id))
            classData.push({
              id: class_.id,
              name: class_.name,
            });
        });
      }

      if (programmeData.length == 0 || classData.length == 0) {
        return 1; // user cannot access this announcement so do not include in result
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

    response.status(200).json({ success: true, announcements: result }).send();
    return;
  } catch (error) {
    console.log(error);
    response
      .status(400)
      .json({ success: false, message: error.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

export async function show(
  request: Request<{ id: string }, {}, {}, {}>,
  response: Response<QuestRes<{ announcement: AnnouncementData }>>
): Promise<void> {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      response
        .status(400)
        .json({ success: false, message: GENERIC_ERROR })
        .send();
      return;
    }

    const announcement = await getRepository(Announcement).findOne({
      where: { id: id },
      relations: ["classes", "programmes"],
    });

    if (!announcement) {
      response
        .status(404)
        .json({ success: false, message: ENTITY_NOT_FOUND })
        .send();
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

    response
      .status(200)
      .json({
        success: true,
        announcement: result,
      })
      .send();
    return;
  } catch (error) {
    console.log(error);
    response
      .status(400)
      .json({ success: false, message: error.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}

export async function softDelete(
  request: Request<{ id: string }, {}, {}, {}>,
  response: Response<QuestRes<{}>>
): Promise<void> {
  const id = parseInt(request.params.id, 10);

  try {
    if (isNaN(id)) {
      response
        .status(400)
        .json({ success: false, message: GENERIC_ERROR })
        .send();
      return;
    }

    const announcement = await getRepository(Announcement).findOneOrFail({
      where: { id: id },
    });

    await getRepository(Announcement).softRemove(announcement);

    response.status(200).json({ success: true, id: id }).send();
  } catch (error) {
    switch (error.name) {
      case TYPEORM_ENTITYNOTFOUND:
        response
          .status(404)
          .json({ success: false, message: ENTITY_NOT_FOUND })
          .send();
        return;

      default:
        console.log(error);
        response
          .status(400)
          .json({ success: false, message: error.message ?? GENERIC_ERROR })
          .send();
        return;
    }
  }
}

export async function edit(
  request: Request<{ id: string }, {}, AnnouncementPatchData, {}>,
  response: Response<QuestRes<{}>>
): Promise<void> {
  try {
    const id = parseInt(request.params.id, 10);

    if (isNaN(id)) {
      response
        .status(400)
        .json({ success: false, message: GENERIC_ERROR })
        .send();
      return;
    }

    let existingData: Announcement = await getRepository(
      Announcement
    ).findOneOrFail({
      where: { id: id },
    });

    if (request.body.programmeIds || request.body.classIds) {
      let { programmes, classes } = await addProgrammesAndClassesData(
        request.body.programmeIds ?? [],
        request.body.classIds ?? []
      );
      existingData.programmes = programmes;
      existingData.classes = classes;
    }

    let newTitle: string = request.body.title ?? existingData.title;
    let newStartDate: Date = request.body.startDate ?? existingData.startDate;
    let newEndDate: Date = request.body.endDate ?? existingData.endDate;
    let newBody: string | null = request.body.body ?? existingData.body;

    existingData.title = newTitle;
    existingData.startDate = newStartDate;
    existingData.endDate = newEndDate;
    existingData.body = newBody;

    await getRepository(Announcement).save(existingData);

    response.status(200).json({ success: true, id: existingData.id }).send();
  } catch (error) {
    console.log(error);
    response
      .status(400)
      .json({ success: false, message: error.message ?? GENERIC_ERROR })
      .send();
    return;
  }
}
