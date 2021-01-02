import { ClassListData } from "./classes";
import { DiscardableData } from "./entities";

// PATCH /programmes/:programmeId
// if .classes is not given, will not edit associated classes
// within .classes, if there is an id, backend will keep it
// if there is no id, it will associate a new class to it
export interface ProgrammePatchData {
  name?: string;
  description?: string;
  classes?: {
    id?: number;
    name?: string;
    description?: string;
  }[];
}

// POST /programmes/create
export interface ProgrammePostData {
  name: string;
  description?: string;
  classes?: {
    name: string;
    description?: string;
  }[];
}

// GET /programmes
export interface ProgrammeListData extends DiscardableData {
  name: string;
  classCount: number;
  description?: string;
}

// GET /programmes/:programmeId
export interface ProgrammeData extends ProgrammeListData {
  classes: ClassListData[];
  studentCount: number; // unique students
  teacherCount: number; // unique teachers
}
