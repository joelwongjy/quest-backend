import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
} from "class-validator";
import { Column, Entity, OneToMany, OneToOne } from "typeorm";
import { Discardable } from "./Discardable";
import { User } from "./User";
import { Gender } from "../types/persons";
import { Relationship } from "./Relationship";

@Entity()
export class Person extends Discardable {
  entityName = "Person";

  constructor(
    name: string,
    gender: Gender,
    email?: string,
    mobile_number?: string,
    home_number?: string,
    birthday?: null,
    user?: User
  ) {
    super();
    this.name = name;
    this.gender = gender;
    this.email = email ?? null;
    this.mobile_number = mobile_number ?? null;
    this.home_number = home_number ?? null;
    this.birthday = birthday ?? null;
    this.user = user ?? null;
  }

  @Column()
  @IsNotEmpty()
  name: string;

  @Column({
    type: "enum",
    enum: Gender,
  })
  @IsEnum(Gender)
  gender: Gender;

  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  @IsEmail()
  email: string | null;

  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  @IsPhoneNumber("SG")
  mobile_number: string | null;

  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  @IsPhoneNumber("SG")
  home_number: string | null;

  @Column({ type: "date", nullable: true })
  birthday: Date | null;

  @OneToOne((type) => User, { nullable: true })
  user: User | null;

  @OneToMany(
    (type) => Relationship,
    (relationship) => relationship.family_member
  )
  youths!: Relationship[];

  @OneToMany((type) => Relationship, (relationship) => relationship.youth)
  family_members!: Relationship[];
}
