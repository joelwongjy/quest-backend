import { Column, Entity, ManyToOne } from "typeorm";
import { Base } from "../Base";
import { Person } from "./Person";
import { RelationshipType } from "./RelationshipType";

@Entity()
export class Relationship extends Base {
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
  youth!: Person;

  @ManyToOne((type) => Person, (family_member) => family_member.youths)
  family_member!: Person;

  @Column({
    type: "enum",
    enum: RelationshipType,
  })
  relationship!: RelationshipType;
}
