import { ClassPersonRole } from "./classPersons";
import { DiscardableData } from "./entities";
import { RelationshipType } from "./relationships";
import { UserData } from "./users";

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export interface PersonPostData {
  name: string;
  gender: Gender;
  email?: string;
  mobileNumber?: string;
  homeNumber?: string;
  birthday?: Date | string;
  classIds: number[];
}

export interface PersonListData extends DiscardableData {
  name: string;
  mobileNumber?: string;
}

export interface PersonData extends PersonListData {
  // imageUrl: string // not in backend yet
  birthday?: Date | string;
  gender: Gender;
  mobileNumber?: string;
  homeNumber?: string;
  email?: string;
  highestClassRole: ClassPersonRole;
  relatives: {
    person: PersonListData;
    relationship: RelationshipType;
  }[];
  programmes: {
    id: number;
    name: string;
    classes: {
      id: number;
      name: string;
      role: ClassPersonRole;
    }[];
  }[];
  user?: UserData;
}

export interface PersonDeleteData {
  persons: number[];
}
