import { getRepository } from "typeorm";
import { Class } from "../entities/programme/Class";
import { ClassUser } from "../entities/programme/ClassUser";
import { ClassUserRole } from "../types/classUsers";

export function allowedRole(role: ClassUserRole, requiredRole: ClassUserRole) {
  return (
    role === ClassUserRole.TEACHER ||
    requiredRole === ClassUserRole.STUDENT ||
    (requiredRole === ClassUserRole.ADMIN && role === ClassUserRole.ADMIN)
  );
}

export const allowedRequester = async (
  userId: number,
  classId: number | string,
  requiredRole: ClassUserRole
): Promise<false | { class_: Class; requester: ClassUser }> => {
  const class_ = await getRepository(Class).findOne(classId, {
    relations: ["classUsers"],
  });
  if (!class_) {
    return false;
  }
  const requester = class_.classUsers!.find(
    (classUser) => classUser.id === userId && !classUser.discardedAt
  );
  if (!requester || !allowedRole(requester.role, requiredRole)) {
    return false;
  }
  return { class_, requester };
};

export const allowedRequesterOrFail = async (
  userId: number,
  classId: number | string,
  requiredRole: ClassUserRole
): Promise<{ class_: Class; requester: ClassUser }> => {
  const allowed = await allowedRequester(userId, classId, requiredRole);
  if (!allowed) {
    throw new Error("User is not allowed to access this resource");
  }
  return allowed;
};
