import { MigrationInterface, QueryRunner } from "typeorm";

export class SetProgQnnaireFKsToNotNull1622862166408
  implements MigrationInterface
{
  name = "SetProgQnnaireFKsToNotNull1622862166408";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e"`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_26db013e899886ce702f9a366f7"`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ALTER COLUMN "programmeId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "programme_questionnaire"."programmeId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ALTER COLUMN "questionnaireId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "programme_questionnaire"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_26db013e899886ce702f9a366f7" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_26db013e899886ce702f9a366f7"`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "programme_questionnaire"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ALTER COLUMN "questionnaireId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "programme_questionnaire"."programmeId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ALTER COLUMN "programmeId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_26db013e899886ce702f9a366f7" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
