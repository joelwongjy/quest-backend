import { DiscardableData } from "./entities";

export interface ClassListData extends DiscardableData {
  name: string;
}

export interface ClassData extends ClassListData {}
