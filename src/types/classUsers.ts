export enum ClassUserRole {
  TEACHER = "Teacher",
  STUDENT = "Student",
}

export function isClassUserRole(role: any): role is ClassUserRole {
  return Object.values(ClassUserRole).includes(role);
}
