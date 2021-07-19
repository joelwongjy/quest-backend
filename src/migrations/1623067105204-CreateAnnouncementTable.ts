import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnnouncementTable1623067105204
  implements MigrationInterface
{
  name = "CreateAnnouncementTable1623067105204";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "announcement" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "date" TIMESTAMP NOT NULL, "title" character varying NOT NULL, "body" character varying, "programmeId" integer, "classId" integer, CONSTRAINT "PK_e0ef0550174fd1099a308fd18a0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_fb7bdf78d58491c24f93d8d7031" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_d351c526fb2245e761711d9f2b4" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT "FK_d351c526fb2245e761711d9f2b4"`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT "FK_fb7bdf78d58491c24f93d8d7031"`
    );
    await queryRunner.query(`DROP TABLE "announcement"`);
  }
}
