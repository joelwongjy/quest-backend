import { IsEnum } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Person } from "./Person";
import { RelationshipType } from "../types/relationships";
import { Discardable } from "./Discardable";

@Entity()
export class Relationship extends Discardable {
  entityName = "Relationship";

  constructor(
    youth: Person,
    family_member: Person,
    relationshipType: RelationshipType
  ) {
    super();
    this.youth = youth;
    this.family_member = family_member;
    this.relationship = relationshipType;
  }

  @ManyToOne((type) => Person, (youth) => youth.family_members)
  youth: Person;

  @ManyToOne((type) => Person, (family_member) => family_member.youths)
  family_member: Person;

  @Column({
    type: "enum",
    enum: RelationshipType,
  })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}
