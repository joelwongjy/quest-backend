import { MigrationInterface, QueryRunner } from "typeorm";

export class SetQnnaireWindowFKsToNotNull1622862531790
  implements MigrationInterface
{
  name = "SetQnnaireWindowFKsToNotNull1622862531790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" DROP CONSTRAINT "FK_16e4273ccbad65053b0ae69f077"`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ALTER COLUMN "questionnaireId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "questionnaire_window"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ADD CONSTRAINT "FK_16e4273ccbad65053b0ae69f077" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" DROP CONSTRAINT "FK_16e4273ccbad65053b0ae69f077"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "questionnaire_window"."questionnaireId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ALTER COLUMN "questionnaireId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ADD CONSTRAINT "FK_16e4273ccbad65053b0ae69f077" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
