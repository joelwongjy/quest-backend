import { MigrationInterface, QueryRunner } from "typeorm";

export class SetAttemptFKsToNotNull1622823906845 implements MigrationInterface {
  name = "SetAttemptFKsToNotNull1622823906845";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_dd8844876037b478f5bb859512e"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_4611c4e51ee6132affec40cabf7"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ALTER COLUMN "userId" SET NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "attempt"."userId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "attempt" ALTER COLUMN "questionnaireWindowId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "attempt"."questionnaireWindowId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_dd8844876037b478f5bb859512e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_4611c4e51ee6132affec40cabf7" FOREIGN KEY ("questionnaireWindowId") REFERENCES "questionnaire_window"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_4611c4e51ee6132affec40cabf7"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_dd8844876037b478f5bb859512e"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "attempt"."questionnaireWindowId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ALTER COLUMN "questionnaireWindowId" DROP NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "attempt"."userId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "attempt" ALTER COLUMN "userId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_4611c4e51ee6132affec40cabf7" FOREIGN KEY ("questionnaireWindowId") REFERENCES "questionnaire_window"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_dd8844876037b478f5bb859512e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
