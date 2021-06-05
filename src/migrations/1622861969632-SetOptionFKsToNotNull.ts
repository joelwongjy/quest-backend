import { MigrationInterface, QueryRunner } from "typeorm";

export class SetOptionFKsToNotNull1622861969632 implements MigrationInterface {
  name = "SetOptionFKsToNotNull1622861969632";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "option" DROP CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3"`
    );
    await queryRunner.query(
      `ALTER TABLE "option" ALTER COLUMN "questionId" SET NOT NULL`
    );
    await queryRunner.query(`COMMENT ON COLUMN "option"."questionId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "option" ADD CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "option" DROP CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3"`
    );
    await queryRunner.query(`COMMENT ON COLUMN "option"."questionId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "option" ALTER COLUMN "questionId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "option" ADD CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
