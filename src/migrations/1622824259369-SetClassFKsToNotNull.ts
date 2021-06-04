import { MigrationInterface, QueryRunner } from "typeorm";

export class SetClassFKsToNotNull1622824259369 implements MigrationInterface {
  name = "SetClassFKsToNotNull1622824259369";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09"`
    );
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "programmeId" SET NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "class"."programmeId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09"`
    );
    await queryRunner.query(`COMMENT ON COLUMN "class"."programmeId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "class" ALTER COLUMN "programmeId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
