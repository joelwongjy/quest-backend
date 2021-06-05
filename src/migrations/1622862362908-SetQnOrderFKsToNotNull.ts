import { MigrationInterface, QueryRunner } from "typeorm";

export class SetQnOrderFKsToNotNull1622862362908 implements MigrationInterface {
  name = "SetQnOrderFKsToNotNull1622862362908";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ALTER COLUMN "questionId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "question_order"."questionId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ALTER COLUMN "questionSetId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "question_order"."questionSetId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d" FOREIGN KEY ("questionSetId") REFERENCES "question_set"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "question_order"."questionSetId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ALTER COLUMN "questionSetId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "question_order"."questionId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ALTER COLUMN "questionId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d" FOREIGN KEY ("questionSetId") REFERENCES "question_set"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
