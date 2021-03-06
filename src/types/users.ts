import { DiscardableData, isDiscardableData } from "./entities";

export enum DefaultUserRole {
  ADMIN = "Admin",
  USER = "User",
}

export interface UserPostData {
  username: string;
  name: string; // is there a need for name?
  password: string | null;
  defaultUserRole?: DefaultUserRole;
}

export interface UserPatchData {
  username: string;
  name: string;
}

export interface UserListData extends DiscardableData {
  username: string;
  name: string;
  appRole: DefaultUserRole;
}

export interface UserData extends UserListData {}

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
