import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { Discardable } from "../Discardable";
import { QuestionOrder } from "./QuestionOrder";

@Entity()
export class QuestionSet extends Discardable {
  entityName = "QuestionSet";

  constructor(open_at: Date, close_at: Date, question_order_ids: number[]) {
    super();
    this.open_at = open_at;
    this.close_at = close_at;
    this.question_order_ids = question_order_ids;
  }

  @Column({ type: "timestamp without time zone" })
  open_at!: Date;

  @Column({ type: "timestamp without time zone" })
  close_at!: Date;

  @Column("simple-array")
  question_order_ids: number[];
}
