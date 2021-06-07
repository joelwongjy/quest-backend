import { Request, Response } from "express";
import { getConnection, getRepository } from "typeorm";
import { Class } from "../entities/programme/Class";
import { Announcement } from "../entities/programme/Announcement";
import { Programme } from "../entities/programme/Programme";
import { AnnouncementListData, AnnouncementData } from "../types/announcements";

export async function create(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const { title, date, body, programmeId, classId } = request.body;

    if (!title || !date) {
      throw new Error("Kindly provide a title and date");
    }

    if (!classId) {
      // create Announcement for the specific class
      const classQuery: Class[] = await getRepository(Class).find({
        where: { id: classId },
      });

      const announcement = new Announcement(
        classQuery[0].programme,
        classQuery[0],
        date,
        title,
        body
      );

      const announcementData: Announcement = await getRepository(
        Announcement
      ).save(announcement);

      response.status(200).json({ success: true, id: announcementData.id });
      return;
    } else if (!programmeId) {
      // create Announcement for each of the programme's classes

      const programmeQuery: Programme[] = await getRepository(Programme).find({
        where: { id: programmeId },
        relations: ["classes"],
      });

      await Promise.all(
        programmeQuery[0].classes.map((class_: Class) => {
          const announcement = new Announcement(
            programmeQuery[0],
            class_,
            date,
            title,
            body
          );
          return getRepository(Announcement).save(announcement);
        })
      );
    } else {
      throw new Error("Kindly provide valid programmeId or classId");
    }
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
    const announcementsQuery = await getRepository(Announcement).find({
      relations: ["class", "programme"],
    });

    announcementsQuery.map((announcement) => {
      const result: AnnouncementListData = {
        ...announcement.getBase(),
        title: announcement.title,
        date: announcement.date,
        body: announcement.body,
        programmeData: {
          id: announcement.programme.id,
          name: announcement.programme.name,
        },
        classData: {
          id: announcement.class.id,
          name: announcement.class.name,
        },
      };
      return result;
    });

    response.status(200).json({ announcementsQuery });
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
    const { id } = request.params;

    if (!id) {
      response.status(400);
      return;
    }

    const announcement = await getRepository(Announcement).findOne({
      where: { id: id },
      relations: ["class", "programme"],
    });

    if (!announcement) {
      response.sendStatus(404);
      return;
    } else {
      const result: AnnouncementData = {
        ...announcement.getBase(),
        title: announcement.title,
        date: announcement.date,
        body: announcement.body ?? null,
        programmeData: {
          id: announcement.programme.id,
          name: announcement.programme.name,
        },
        classData: {
          id: announcement.class.id,
          name: announcement.class.name,
        },
      };
      response.status(200).json({
        announcement: result,
      });
      return;
    }
  } catch (e) {
    console.log(e);
    response.status(400);
    return;
  }
}
