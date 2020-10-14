import { ClassUserData } from "./classUsers";
import { DiscardableData, isDiscardableData } from "./entities";

export enum DefaultUserRole {
  ADMIN = "Admin",
  USER = "User",
}

export interface UserPostData {
  username: string;
  name: string;
  password?: string | null;
  defaultUserRole?: DefaultUserRole | null;
}

export interface UserPatchData {
  username: string;
  name: string;
}

export interface ContactData {
  mobileNumber?: string;
  homeNumber?: string;
  email?: string;
}

export interface UserListData extends DiscardableData {
  username: string;
  name: string;
}

export interface UserData extends UserListData, ContactData {
  // birthday?: Date;
  // gender: string;
  classes: ClassUserData[];
  // programs: Program[];
}

export function isUserListData(data: any): data is UserListData {
  return (
    typeof data.username === "string" &&
    typeof data.name === "string" &&
    isDiscardableData(data)
  );
}

export function isUserData(data: any): data is UserData {
  return isUserListData(data);
}
