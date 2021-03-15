import { DiscardableData } from "./entities";
import { PersonListData } from "./persons";

// POST /programmes/:programmeId/classes/create
export interface ClassPostData {
  name: string;
  studentIds: number[]; // backend note: personId[]
  teacherIds: number[]; // backend note: personId[]
}

// PATCH /classes/:classId
export interface ClassPatchData {
  name?: string;
  studentIds: number[]; // the complete list of student ids
  teacherIds: number[]; // the complete list of teacher ids
}

// This interface is never directly fetched/sent
// Will always be sent as part of a programme
export interface ClassListData extends DiscardableData {
  name: string;
  studentCount: number;
  teacherCount: number;
  description?: string;
}

// GET /classes/:classId
export interface ClassData extends ClassListData {
  programmeName: string;
  programmeId: number;
  students: PersonListData[];
  teachers: PersonListData[];
}
