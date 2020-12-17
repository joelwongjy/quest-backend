import { getRepository } from "typeorm";
import { Class } from "../entities/programme/Class";
import { ClassPerson } from "../entities/programme/ClassPerson";
import { ClassPersonRole } from "../types/classPersons";

export function allowedRole(
  role: ClassPersonRole,
  requiredRole: ClassPersonRole
) {
  return (
    role === ClassPersonRole.ADMIN || // can do everything
    requiredRole === ClassPersonRole.STUDENT || // minimum clearance
    (requiredRole === ClassPersonRole.TEACHER &&
      role === ClassPersonRole.TEACHER) // in-between
  );
}

export const allowedRequester = async (
  classUserId: number,
  classId: number | string,
  requiredRole: ClassPersonRole
): Promise<false | { class_: Class; requester: ClassPerson }> => {
  const class_ = await getRepository(Class).findOne(classId, {
    relations: ["classPersons"],
  });
  if (!class_) {
    return false;
  }
  const requester = class_.classPersons!.find(
    (classPerson) => classPerson.id === classUserId && !classPerson.discardedAt
  );
  if (!requester || !allowedRole(requester.role, requiredRole)) {
    return false;
  }
  return { class_, requester };
};

export const allowedRequesterOrFail = async (
  userId: number,
  classId: number | string,
  requiredRole: ClassPersonRole
): Promise<{ class_: Class; requester: ClassPerson }> => {
  const allowed = await allowedRequester(userId, classId, requiredRole);
  if (!allowed) {
    throw new Error("User is not allowed to access this resource");
  }
  return allowed;
};
