import { MigrationInterface, QueryRunner } from "typeorm";

export class SetRelationshipFKsToNotNull1622881587547
  implements MigrationInterface
{
  name = "SetRelationshipFKsToNotNull1622881587547";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_9f5039798d1153ec66a5f013f62"`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6"`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ALTER COLUMN "youthId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "relationship"."youthId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ALTER COLUMN "familyMemberId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "relationship"."familyMemberId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_9f5039798d1153ec66a5f013f62" FOREIGN KEY ("youthId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6" FOREIGN KEY ("familyMemberId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6"`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_9f5039798d1153ec66a5f013f62"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "relationship"."familyMemberId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ALTER COLUMN "familyMemberId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "relationship"."youthId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ALTER COLUMN "youthId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6" FOREIGN KEY ("familyMemberId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_9f5039798d1153ec66a5f013f62" FOREIGN KEY ("youthId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
