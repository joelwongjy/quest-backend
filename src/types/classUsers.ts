import { ClassData, ClassListData } from "./classes";
import { DiscardableData } from "./entities";

export enum ClassUserRole {
  TEACHER = "Teacher",
  STUDENT = "Student",
  ADMIN = "Admin",
}

export interface ClassUserListData extends DiscardableData, ClassListData {
  role: ClassUserRole;
}

export interface ClassUserData extends ClassUserListData, ClassData {}

export function isClassUserRole(role: any): role is ClassUserRole {
  return Object.values(ClassUserRole).includes(role);
}
