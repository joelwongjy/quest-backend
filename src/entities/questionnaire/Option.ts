import { IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Mood, OptionPostData, Scale } from "../../types/questions";
import { Discardable } from "../Discardable";
import { Question } from "./Question";

export const MOOD_LIST: string[] = Object.values(Mood);
export const MOOD_OPTIONS: OptionPostData[] = MOOD_LIST.map((mood) => {
  return {
    optionText: mood,
  };
});

export const SCALE_LIST: string[] = Object.values(Scale);
export const SCALE_OPTIONS: OptionPostData[] = SCALE_LIST.map((scale) => {
  return {
    optionText: scale,
  };
});

@Entity()
export class Option extends Discardable {
  entityName = "Option";

  constructor(optionText: string, question: Question) {
    super();
    this.optionText = optionText;
    this.question = question;
  }

  @Column()
  @IsNotEmpty()
  optionText: string;

  @ManyToOne((type) => Question, (question) => question.options, {
    nullable: false,
  })
  question: Question;
}
