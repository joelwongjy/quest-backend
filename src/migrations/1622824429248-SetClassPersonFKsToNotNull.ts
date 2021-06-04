import { MigrationInterface, QueryRunner } from "typeorm";

export class SetClassPersonFKsToNotNull1622824429248
  implements MigrationInterface
{
  name = "SetClassPersonFKsToNotNull1622824429248";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_de27ebd8e46c251560b5baada3f"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_07c0af194502a44825048ec660f"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ALTER COLUMN "personId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_person"."personId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ALTER COLUMN "classId" SET NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_person"."classId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_de27ebd8e46c251560b5baada3f" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_07c0af194502a44825048ec660f" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_07c0af194502a44825048ec660f"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_de27ebd8e46c251560b5baada3f"`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_person"."classId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ALTER COLUMN "classId" DROP NOT NULL`
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "class_person"."personId" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ALTER COLUMN "personId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_07c0af194502a44825048ec660f" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_de27ebd8e46c251560b5baada3f" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
