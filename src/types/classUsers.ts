export enum ClassUserRole {
  TEACHER = "Teacher",
  STUDENT = "Student",
  ADMIN = "Admin",
}

export function isClassUserRole(role: any): role is ClassUserRole {
  return Object.values(ClassUserRole).includes(role);
}
