import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  Validate,
} from "class-validator";
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "./User";
import { Gender } from "../../types/persons";
import { Relationship } from "./Relationship";
import IsPersonlessUser from "../../constraints/IsPersonlessUser";

@Entity()
export class Person extends Discardable {
  entityName = "Person";

  constructor(
    name: string,
    gender: Gender,
    email?: string,
    mobileNumber?: string,
    homeNumber?: string,
    birthday?: null,
    user?: User
  ) {
    super();
    this.name = name;
    this.gender = gender;
    this.email = email ?? null;
    this.mobileNumber = mobileNumber ?? null;
    this.homeNumber = homeNumber ?? null;
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
  mobileNumber: string | null;

  @Column({ type: "character varying", nullable: true })
  @IsOptional()
  @IsPhoneNumber("SG")
  homeNumber: string | null;

  @Column({ type: "date", nullable: true })
  birthday: Date | null;

  @OneToOne((type) => User, { nullable: true })
  @JoinColumn()
  @Validate(IsPersonlessUser)
  user: User | null;

  @OneToMany(
    (type) => Relationship,
    (relationship) => relationship.familyMember
  )
  youths!: Relationship[];

  @OneToMany((type) => Relationship, (relationship) => relationship.youth)
  familyMembers!: Relationship[];
}
