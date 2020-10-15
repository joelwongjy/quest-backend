import { DiscardableData } from "./entities";

export interface ProgrammeListData extends DiscardableData {
  name: string;
}

export interface ProgrammeData extends ProgrammeListData {}
