import { IsNotEmpty, IsOptional } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { Programme } from "./Programme";
import { Class } from "./Class";

@Entity()
export class Announcement extends Discardable {
  entityName = "Announcement";

  constructor(
    startDate: Date,
    endDate: Date,
    title: string,
    programmes?: Programme[],
    classes?: Class[],
    body?: string
  ) {
    super();

    this.startDate = startDate;
    this.endDate = endDate;
    this.title = title;
    this.programmes = programmes;
    this.classes = classes;
    this.body = body ?? null;
  }

  // A programme can have 0 to many announcements
  @ManyToMany(() => Programme, (programme) => programme.announcements, {
    nullable: true,
    cascade: true, // for soft-delete purposes
  })
  @JoinTable()
  programmes: Programme[] | undefined;

  // A programme can have 0 to many announcements
  @ManyToMany(() => Class, (class_) => class_.announcements, {
    nullable: true,
    cascade: true, // for soft-delete purposes
  })
  @JoinTable()
  classes: Class[] | undefined;

  // Refers to the date the Announcement becomes visible to students
  @Column()
  startDate: Date;

  // Refers to the date the Announcement is no longer visible to students
  @Column()
  endDate: Date;

  @Column()
  @IsNotEmpty()
  title: string;

  // the content of the Announcement, allowed to be empty if title is self-explanatory
  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  body: string | null;
}
