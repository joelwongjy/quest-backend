import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEndDateToAnnouncements1624265939769
  implements MigrationInterface
{
  name = "AddEndDateToAnnouncements1624265939769";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT "FK_fb7bdf78d58491c24f93d8d7031"`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP CONSTRAINT "FK_d351c526fb2245e761711d9f2b4"`
    );
    await queryRunner.query(
      `CREATE TABLE "announcement_programmes_programme" ("announcementId" integer NOT NULL, "programmeId" integer NOT NULL, CONSTRAINT "PK_f0122fefecdc60a0d148c2ae076" PRIMARY KEY ("announcementId", "programmeId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_391566f54803fb309035c659bb" ON "announcement_programmes_programme" ("announcementId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6fc016f5810806d06778eeb03" ON "announcement_programmes_programme" ("programmeId") `
    );
    await queryRunner.query(
      `CREATE TABLE "announcement_classes_class" ("announcementId" integer NOT NULL, "classId" integer NOT NULL, CONSTRAINT "PK_14009d704b069b53e31fea77c55" PRIMARY KEY ("announcementId", "classId"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7f778e6b700998010d14294cf" ON "announcement_classes_class" ("announcementId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_394d8569d275f9eceeb26577f6" ON "announcement_classes_class" ("classId") `
    );
    await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "date"`);
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "programmeId"`
    );
    await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "classId"`);
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD "startDate" TIMESTAMP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD "endDate" TIMESTAMP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_programmes_programme" ADD CONSTRAINT "FK_391566f54803fb309035c659bb4" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_programmes_programme" ADD CONSTRAINT "FK_c6fc016f5810806d06778eeb030" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_classes_class" ADD CONSTRAINT "FK_d7f778e6b700998010d14294cf6" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_classes_class" ADD CONSTRAINT "FK_394d8569d275f9eceeb26577f64" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcement_classes_class" DROP CONSTRAINT "FK_394d8569d275f9eceeb26577f64"`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_classes_class" DROP CONSTRAINT "FK_d7f778e6b700998010d14294cf6"`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_programmes_programme" DROP CONSTRAINT "FK_c6fc016f5810806d06778eeb030"`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement_programmes_programme" DROP CONSTRAINT "FK_391566f54803fb309035c659bb4"`
    );
    await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "endDate"`);
    await queryRunner.query(
      `ALTER TABLE "announcement" DROP COLUMN "startDate"`
    );
    await queryRunner.query(`ALTER TABLE "announcement" ADD "classId" integer`);
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD "programmeId" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD "date" TIMESTAMP NOT NULL`
    );
    await queryRunner.query(`DROP INDEX "IDX_394d8569d275f9eceeb26577f6"`);
    await queryRunner.query(`DROP INDEX "IDX_d7f778e6b700998010d14294cf"`);
    await queryRunner.query(`DROP TABLE "announcement_classes_class"`);
    await queryRunner.query(`DROP INDEX "IDX_c6fc016f5810806d06778eeb03"`);
    await queryRunner.query(`DROP INDEX "IDX_391566f54803fb309035c659bb"`);
    await queryRunner.query(`DROP TABLE "announcement_programmes_programme"`);
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_d351c526fb2245e761711d9f2b4" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "announcement" ADD CONSTRAINT "FK_fb7bdf78d58491c24f93d8d7031" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
