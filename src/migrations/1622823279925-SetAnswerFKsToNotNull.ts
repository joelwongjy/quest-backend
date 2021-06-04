import { MigrationInterface, QueryRunner } from "typeorm";

export class SetAnswerFKsToNotNull1622823279925 implements MigrationInterface {
  name = "SetAnswerFKsToNotNull1622823279925";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_6ba348e115d3d868d39b02971b9"`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_df3b92aa295640d070922ebc382"`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ALTER COLUMN "questionOrderId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "answer"."questionOrderId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ALTER COLUMN "attemptId" SET NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "answer"."attemptId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_6ba348e115d3d868d39b02971b9" FOREIGN KEY ("questionOrderId") REFERENCES "question_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_df3b92aa295640d070922ebc382" FOREIGN KEY ("attemptId") REFERENCES "attempt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_df3b92aa295640d070922ebc382"`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_6ba348e115d3d868d39b02971b9"`
    );
    await queryRunner.query(`COMMENT ON COLUMN "answer"."attemptId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "answer" ALTER COLUMN "attemptId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "answer"."questionOrderId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ALTER COLUMN "questionOrderId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_df3b92aa295640d070922ebc382" FOREIGN KEY ("attemptId") REFERENCES "attempt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_6ba348e115d3d868d39b02971b9" FOREIGN KEY ("questionOrderId") REFERENCES "question_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
