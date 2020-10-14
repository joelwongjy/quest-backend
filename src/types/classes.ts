import { DiscardableData } from "./entities";
import { ProgrammeData } from "./programmes";

export interface ClassListData extends DiscardableData {
  name: string;
}

export interface ClassData extends ClassListData {
  programme: ProgrammeData;
}
