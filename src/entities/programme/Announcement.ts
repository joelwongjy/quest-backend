import { IsNotEmpty, IsOptional } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { Programme } from "./Programme";
import { Class } from "./Class";
import { AnnouncementListData } from "../../types/announcements";

@Entity()
export class Announcement extends Discardable {
  entityName = "Announcement";

  constructor(
    programme_: Programme,
    class_: Class,
    date: Date,
    title: string,
    body?: string
  ) {
    super();
    this.programme = programme_;
    this.class = class_;
    this.date = date;
    this.title = title;
    this.body = body ?? null;
  }

  // A programme can have 0 to many announcements
  @ManyToOne((type) => Programme, (programme_) => programme_.announcements, {
    nullable: true,
  })
  programme: Programme;

  // A class can have 0 to many announcements
  @ManyToOne((type) => Class, (class_) => class_.announcements, {
    nullable: true,
  })
  class: Class;

  // Refers to the date the Announcement becomes visible to students
  @Column()
  date: Date;

  @Column()
  @IsNotEmpty()
  title: string;

  // the content of the Announcement, allowed to be empty if title is self-explanatory
  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  body: string | null;
}
