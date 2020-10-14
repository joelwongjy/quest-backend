import { getRepository } from "typeorm";
import { RelationshipType } from "../../../types/relationships";
import { Person } from "../../../entities/user/Person";
import { Relationship } from "../../../entities/user/Relationship";
import { Gender } from "../../../types/persons";
import ApiServer from "../../../server";
import { synchronize } from "../../../utils/tests";

let server: ApiServer;

beforeAll(async () => {
  server = new ApiServer();
  await server.initialize();
  await synchronize(server);
});

afterAll(async () => {
  await server.close();
});

describe("Relationship", () => {
  describe("with A(youth), B(father)", () => {
    let youth: Person, father: Person;

    beforeAll(async () => {
      const youthData = new Person("A", Gender.MALE);
      const fatherData = new Person("B", Gender.MALE);

      // this assumes the order is guaranteed
      const [savedYouth, savedFather] = await getRepository(Person).save([
        youthData,
        fatherData,
      ]);

      youth = savedYouth;
      father = savedFather;
    });

    afterAll(async () => {
      await synchronize(server);
    });

    it("saves to relationship table", async () => {
      const relationship = new Relationship(
        youth,
        father,
        RelationshipType.FATHER
      );
      const savedFather = await getRepository(Relationship).save(relationship);

      expect(savedFather).toBeTruthy();
    });

    it("query using relationship table", async () => {
      const getRelationships = await getRepository(Relationship).find({
        where: { youth: { id: youth.id } },
        relations: ["youth", "familyMember"],
      });

      expect(getRelationships.length).toBe(1);
      expect(getRelationships[0].youth.name).toBe(youth.name);
      expect(getRelationships[0].familyMember.name).toBe(father.name);
    });

    describe("query using person table", () => {
      it("search for father and get related youth", async () => {
        const fatherQuery = await getRepository(Person).find({
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
        const youthQuery = await getRepository(Person).find({
          where: { id: youth.id },
          relations: ["familyMembers", "familyMembers.familyMember"],
        });

        expect(youthQuery.length).toBe(1);
        expect(youthQuery[0].familyMembers?.length).toBe(1);
        youthQuery[0].familyMembers?.forEach((relationship) => {
          expect(relationship.familyMember.name).toBe(father.name);
        });
      });
    });
  });
});
