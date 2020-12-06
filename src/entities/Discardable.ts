import { DeleteDateColumn } from "typeorm";
import { addHours } from "date-fns";
import { DiscardableData } from "../types/entities";
import { Base } from "./Base";

export abstract class Discardable extends Base {
  @DeleteDateColumn()
  discardedAt!: Date | null;

  getBase = (): DiscardableData => ({
    id: this.id,
    createdAt: addHours(this.createdAt, 8),
    updatedAt: addHours(this.updatedAt, 8),
    discardedAt: this.discardedAt ? addHours(this.discardedAt, 8) : null,
  });
}
