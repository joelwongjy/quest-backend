import { ClassData } from "./classes";
import { DiscardableData } from "./entities";

export enum ClassUserRole {
  TEACHER = "Teacher",
  STUDENT = "Student",
  ADMIN = "Admin",
}

export interface ClassUserListData extends DiscardableData {
  class: ClassData;
  role: ClassUserRole;
}

export interface ClassUserData extends ClassUserListData {}

export function isClassUserRole(role: any): role is ClassUserRole {
  return Object.values(ClassUserRole).includes(role);
}
