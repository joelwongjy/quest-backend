import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  Validate,
} from "class-validator";
import {
  Column,
  Entity,
  getRepository,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Discardable } from "../Discardable";
import { User } from "./User";
import { Gender, PersonData, PersonListData } from "../../types/persons";
import { Relationship } from "./Relationship";
import IsPersonlessUser from "../../constraints/IsPersonlessUser";
import { DefaultUserRole } from "../../types/users";
import { ClassPersonRole } from "../../types/classPersons";
import { Programme } from "../programme/Programme";
import { ClassPerson } from "../programme/ClassPerson";

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

  @OneToMany((type) => ClassPerson, (classUser) => classUser.person)
  classPersons!: ClassPerson[];

  @OneToMany(
    (type) => Relationship,
    (relationship) => relationship.familyMember
  )
  youths!: Relationship[];

  @OneToMany((type) => Relationship, (relationship) => relationship.youth)
  familyMembers!: Relationship[];

  getListData = (): PersonListData => ({
    ...this.getBase(),
    name: this.name,
  });

  getData = async (): Promise<PersonData> => {
    const user =
      this.user ||
      (await getRepository(User).findOne({
        where: { personId: this.id },
      }));

    let highestClassRole: ClassPersonRole;
    let programmes: PersonData["programmes"] = [];
    if (user && user.defaultRole === DefaultUserRole.ADMIN) {
      highestClassRole = ClassPersonRole.ADMIN;
      const allProgrammes = await getRepository(Programme).find({
        relations: ["classes"],
      });
      programmes = allProgrammes.map((p) => {
        return {
          id: p.id,
          name: p.name,
          classes: p.classes.map((c) => ({
            id: c.id,
            name: c.name,
            role: ClassPersonRole.ADMIN,
          })),
        };
      });
    } else {
      const fullPerson = await getRepository(Person).findOneOrFail({
        where: { id: this.id },
        relations: [
          "classPersons",
          "classPersons.class",
          "classPersons.class.programme",
        ],
      });

      highestClassRole = ClassPersonRole.STUDENT;
      fullPerson.classPersons.forEach((cu) => {
        if (cu.role === ClassPersonRole.TEACHER) {
          highestClassRole = ClassPersonRole.TEACHER;
        }
        const index = programmes.findIndex(
          (p) => p.id === cu.class.programme.id
        );
        if (index === -1) {
          programmes.push({
            id: cu.class.programme.id,
            name: cu.class.programme.name,
            classes: [
              {
                id: cu.class.id,
                name: cu.class.name,
                role: cu.role,
              },
            ],
          });
        } else {
          programmes[index].classes.push({
            id: cu.class.id,
            name: cu.class.name,
            role: cu.role,
          });
        }
      });
    }

    const relatives: PersonData["relatives"] = [];
    const youths =
      this.youths ||
      (await getRepository(Relationship).find({
        where: { familyMemberId: this.id },
        relations: ["youth"],
      }));
    youths.forEach((y) =>
      relatives.push({
        person: y.youth.getListData(),
        relationship: y.relationship,
      })
    );
    const familyMembers =
      this.familyMembers ||
      (await getRepository(Relationship).find({
        where: { youthId: this.id },
        relations: ["familyMember"],
      }));
    familyMembers.forEach((f) => {
      relatives.push({
        person: f.familyMember.getListData(),
        relationship: f.relationship,
      });
    });

    return {
      ...this.getListData(),
      birthday: this.birthday ?? undefined,
      gender: this.gender,
      mobileNumber: this.mobileNumber ?? undefined,
      homeNumber: this.homeNumber ?? undefined,
      email: this.email ?? undefined,
      highestClassRole,
      relatives,
      programmes,
      user: user ? user.getData() : undefined,
    };
  };
}
