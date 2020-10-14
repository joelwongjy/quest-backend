import { DiscardableData } from "./entities";
import { ProgrammeData } from "./programmes";

export interface ClassListData extends DiscardableData {
  name: string;
  programme: ProgrammeListData;
}

// TODO: Add students, etc. to Class Data
export interface ClassData extends ClassListData {}
