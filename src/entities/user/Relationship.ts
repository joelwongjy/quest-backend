import { IsEnum } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { Person } from "./Person";
import { RelationshipType } from "../../types/relationships";
import { Discardable } from "../Discardable";

@Entity()
export class Relationship extends Discardable {
  entityName = "Relationship";

  constructor(
    youth: Person,
    familyMember: Person,
    relationshipType: RelationshipType
  ) {
    super();
    this.youth = youth;
    this.familyMember = familyMember;
    this.relationship = relationshipType;
  }

  @ManyToOne((type) => Person, (youth) => youth.familyMembers)
  youth: Person;

  @ManyToOne((type) => Person, (familyMember) => familyMember.youths)
  familyMember: Person;

  @Column({
    type: "enum",
    enum: RelationshipType,
  })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;
}
