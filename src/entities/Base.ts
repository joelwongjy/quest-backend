import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { addHours } from "date-fns";
import { BaseData } from "../types/entities";

export abstract class Base {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  getBase = (): BaseData => ({
    id: this.id,
    createdAt: addHours(this.createdAt, 8),
    updatedAt: addHours(this.updatedAt, 8),
  });

  abstract entityName: string;
}
