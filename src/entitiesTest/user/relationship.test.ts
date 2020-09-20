import { postgres } from "../../../ormconfig";
import { Connection, createConnection } from "typeorm";
import { RelationshipType } from "../../types/relationships";
import { Person } from "../../entities/user/Person";
import { Relationship } from "../../entities/user/Relationship";
import { Gender } from "../../types/persons";

let connection: Connection;

beforeAll(async () => {
  connection = await createConnection(postgres);
});

afterAll(async () => {
  await connection.close();
});

describe("Relationship", () => {
  describe("with A(youth), B(father)", () => {
    let youth: Person, father: Person;

    beforeAll(async () => {
      const youthData = new Person("A", Gender.MALE);
      const fatherData = new Person("B", Gender.MALE);

      // this assumes the order is guaranteed
      const [savedYouth, savedFather] = await connection
        .getRepository(Person)
        .save([youthData, fatherData]);

      youth = savedYouth;
      father = savedFather;
    });

    afterAll(async () => {
      const personRepository = connection.getRepository(Person);
      const rsRepository = connection.getRepository(Relationship);

      await rsRepository.delete({});
      await personRepository.delete({});
    });

    it("saves to relationship table", async () => {
      const relationship = new Relationship(
        youth,
        father,
        RelationshipType.FATHER
      );
      const savedFather = await connection
        .getRepository(Relationship)
        .save(relationship);

      expect(savedFather).toBeTruthy();
    });

    it("query using relationship table", async () => {
      const getRelationships = await connection
        .getRepository(Relationship)
        .find({
          where: { youth: { id: youth.id } },
          relations: ["youth", "family_member"],
        });

      expect(getRelationships.length).toBe(1);
      expect(getRelationships[0].youth.name).toBe(youth.name);
      expect(getRelationships[0].family_member.name).toBe(father.name);
    });

    describe("query using person table", () => {
      it("search for father and get related youth", async () => {
        const fatherQuery = await connection.getRepository(Person).find({
          where: { id: father.id },
          relations: ["youths", "youths.youth"],
        });

        expect(fatherQuery.length).toBe(1);
        expect(fatherQuery[0].youths?.length).toBe(1);
        fatherQuery[0].youths?.forEach((relationship) => {
          expect(relationship.youth.name).toBe(youth.name);
        });
      });

      it("search for youth and get related father", async () => {
        const youthQuery = await connection.getRepository(Person).find({
          where: { id: youth.id },
          relations: ["family_members", "family_members.family_member"],
        });

        expect(youthQuery.length).toBe(1);
        expect(youthQuery[0].family_members?.length).toBe(1);
        youthQuery[0].family_members?.forEach((relationship) => {
          expect(relationship.family_member.name).toBe(father.name);
        });
      });
    });
  });
});
