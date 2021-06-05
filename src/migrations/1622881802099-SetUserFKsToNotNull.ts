import { MigrationInterface, QueryRunner } from "typeorm";

export class SetUserFKsToNotNull1622881802099 implements MigrationInterface {
  name = "SetUserFKsToNotNull1622881802099";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "personId" SET NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."personId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8"`
    );
    await queryRunner.query(`COMMENT ON COLUMN "user"."personId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "personId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
