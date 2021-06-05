import { MigrationInterface, QueryRunner } from "typeorm";

export class SetClassQnnaireFKsToNotNull1622824742338
  implements MigrationInterface
{
  name = "SetClassQnnaireFKsToNotNull1622824742338";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_d74f9f958278899a108e3bbfd79"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ALTER COLUMN "classId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_questionnaire"."classId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ALTER COLUMN "questionnaireId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_questionnaire"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_d74f9f958278899a108e3bbfd79" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_d74f9f958278899a108e3bbfd79"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_questionnaire"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ALTER COLUMN "questionnaireId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_questionnaire"."classId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ALTER COLUMN "classId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_d74f9f958278899a108e3bbfd79" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
