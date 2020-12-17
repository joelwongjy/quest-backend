import { DiscardableData } from "./entities";
import { PersonListData } from "./persons";

// POST /programmes/:programmeId/classes/create
export interface ClassPostData {
  name: string;
  studentIds: number[]; // backend note: personId[]
}

// PATCH /classes/:classId
export interface ClassPatchData {
  name?: string;
  studentIds?: number[]; // the complete list of student ids
}

// This interface is never directly fetched/sent
// Will always be sent as part of a programme
export interface ClassListData extends DiscardableData {
  name: string;
  studentCount: number;
  teacherCount: number;
}

// GET /classes/:classId
export interface ClassData extends ClassListData {
  description?: string;
  programmeName: string;
  programmeId: number;
  students: PersonListData[];
  teachers: PersonListData[];
}
