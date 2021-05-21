import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1621521197853 implements MigrationInterface {
  name = "InitialSetup1621521197853";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "option" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "optionText" character varying NOT NULL, "questionId" integer, CONSTRAINT "PK_e6090c1c6ad8962eea97abdbe63" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "question_questiontype_enum" AS ENUM('MULTIPLE CHOICE', 'MOOD', 'SHORT ANSWER', 'LONG ANSWER', 'SCALE')`
    );
    await queryRunner.query(
      `CREATE TABLE "question" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "questionText" character varying NOT NULL, "questionType" "question_questiontype_enum" NOT NULL, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "question_order" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "order" integer NOT NULL, "questionId" integer, "questionSetId" integer, CONSTRAINT "PK_f7e5b54444da30d8dac3b84f002" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "question_set" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_384a616ea05ec06da55c844430b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "questionnaire_window" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "openAt" TIMESTAMP WITH TIME ZONE NOT NULL, "closeAt" TIMESTAMP WITH TIME ZONE NOT NULL, "mainSetId" integer NOT NULL, "sharedSetId" integer, "questionnaireId" integer, CONSTRAINT "PK_762a5bef06e36a14887e4248ac6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "programme" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_76ff6b30b74f213944d1ac0a660" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "programme_questionnaire" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "programmeId" integer, "questionnaireId" integer, CONSTRAINT "PK_3f0e9af9853fc98560d878634b2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "questionnaire_questionnairetype_enum" AS ENUM('ONE TIME', 'PRE POST')`
    );
    await queryRunner.query(
      `CREATE TYPE "questionnaire_questionnairestatus_enum" AS ENUM('DRAFT', 'PUBLISHED')`
    );
    await queryRunner.query(
      `CREATE TABLE "questionnaire" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "questionnaireType" "questionnaire_questionnairetype_enum" NOT NULL, "questionnaireStatus" "questionnaire_questionnairestatus_enum" NOT NULL, CONSTRAINT "PK_e8232a11eaabac903636eb7e71e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "class_questionnaire" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "classId" integer, "questionnaireId" integer, CONSTRAINT "PK_ddb7dc7cc9321df0ad2b458bf37" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "user_defaultrole_enum" AS ENUM('Admin', 'User')`
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "username" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying, "defaultRole" "user_defaultrole_enum" NOT NULL DEFAULT 'User', "personId" integer, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "REL_6aac19005cea8e2119cbe7759e" UNIQUE ("personId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "relationship_relationship_enum" AS ENUM('Father', 'Mother', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Cousin', 'Guardian')`
    );
    await queryRunner.query(
      `CREATE TABLE "relationship" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "relationship" "relationship_relationship_enum" NOT NULL, "youthId" integer, "familyMemberId" integer, CONSTRAINT "PK_67eb56a3f16da3d901a8ae446a6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "person_gender_enum" AS ENUM('Male', 'Female')`
    );
    await queryRunner.query(
      `CREATE TABLE "person" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "gender" "person_gender_enum" NOT NULL, "email" character varying, "mobileNumber" character varying, "homeNumber" character varying, "birthday" date, CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "class_person_role_enum" AS ENUM('Teacher', 'Student', 'Admin')`
    );
    await queryRunner.query(
      `CREATE TABLE "class_person" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "role" "class_person_role_enum" NOT NULL, "personId" integer, "classId" integer, CONSTRAINT "PK_482f5805f3d64009dd1e069c5e0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "class" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "description" character varying, "programmeId" integer, CONSTRAINT "PK_0b9024d21bdfba8b1bd1c300eae" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "attempt" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "userId" integer, "questionnaireWindowId" integer, CONSTRAINT "PK_5f822b29b3128d1c65d3d6c193d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "answer" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "discardedAt" TIMESTAMP WITH TIME ZONE, "answer" character varying, "questionOrderId" integer, "optionId" integer, "attemptId" integer, CONSTRAINT "PK_9232db17b63fb1e94f97e5c224f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "option" ADD CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" ADD CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d" FOREIGN KEY ("questionSetId") REFERENCES "question_set"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ADD CONSTRAINT "FK_61fccabec08fa424437d0a54b07" FOREIGN KEY ("mainSetId") REFERENCES "question_set"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ADD CONSTRAINT "FK_4163f4fdc520962b5c40380f80d" FOREIGN KEY ("sharedSetId") REFERENCES "question_set"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" ADD CONSTRAINT "FK_16e4273ccbad65053b0ae69f077" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" ADD CONSTRAINT "FK_26db013e899886ce702f9a366f7" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_d74f9f958278899a108e3bbfd79" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" ADD CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaire"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_9f5039798d1153ec66a5f013f62" FOREIGN KEY ("youthId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" ADD CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6" FOREIGN KEY ("familyMemberId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_de27ebd8e46c251560b5baada3f" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" ADD CONSTRAINT "FK_07c0af194502a44825048ec660f" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "class" ADD CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09" FOREIGN KEY ("programmeId") REFERENCES "programme"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_dd8844876037b478f5bb859512e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" ADD CONSTRAINT "FK_4611c4e51ee6132affec40cabf7" FOREIGN KEY ("questionnaireWindowId") REFERENCES "questionnaire_window"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_6ba348e115d3d868d39b02971b9" FOREIGN KEY ("questionOrderId") REFERENCES "question_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" ADD CONSTRAINT "FK_996935e4981a0cdf304cebc4bf5" FOREIGN KEY ("optionId") REFERENCES "option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
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
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_996935e4981a0cdf304cebc4bf5"`
    );
    await queryRunner.query(
      `ALTER TABLE "answer" DROP CONSTRAINT "FK_6ba348e115d3d868d39b02971b9"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_4611c4e51ee6132affec40cabf7"`
    );
    await queryRunner.query(
      `ALTER TABLE "attempt" DROP CONSTRAINT "FK_dd8844876037b478f5bb859512e"`
    );
    await queryRunner.query(
      `ALTER TABLE "class" DROP CONSTRAINT "FK_fd45dafa120c0d89ae8a77bae09"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_07c0af194502a44825048ec660f"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_person" DROP CONSTRAINT "FK_de27ebd8e46c251560b5baada3f"`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_a1de0783a6fd031ddebe12ec1a6"`
    );
    await queryRunner.query(
      `ALTER TABLE "relationship" DROP CONSTRAINT "FK_9f5039798d1153ec66a5f013f62"`
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_6aac19005cea8e2119cbe7759e8"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_903c9d696ee4cc18f28fd003bc5"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_questionnaire" DROP CONSTRAINT "FK_d74f9f958278899a108e3bbfd79"`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_26db013e899886ce702f9a366f7"`
    );
    await queryRunner.query(
      `ALTER TABLE "programme_questionnaire" DROP CONSTRAINT "FK_3d0908cf0c023aec8af20c7e60e"`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" DROP CONSTRAINT "FK_16e4273ccbad65053b0ae69f077"`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" DROP CONSTRAINT "FK_4163f4fdc520962b5c40380f80d"`
    );
    await queryRunner.query(
      `ALTER TABLE "questionnaire_window" DROP CONSTRAINT "FK_61fccabec08fa424437d0a54b07"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c9c52f5532f0e17c46831a77e2d"`
    );
    await queryRunner.query(
      `ALTER TABLE "question_order" DROP CONSTRAINT "FK_c4da7260e9413cbb4236b5dbb20"`
    );
    await queryRunner.query(
      `ALTER TABLE "option" DROP CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3"`
    );
    await queryRunner.query(`DROP TABLE "answer"`);
    await queryRunner.query(`DROP TABLE "attempt"`);
    await queryRunner.query(`DROP TABLE "class"`);
    await queryRunner.query(`DROP TABLE "class_person"`);
    await queryRunner.query(`DROP TYPE "class_person_role_enum"`);
    await queryRunner.query(`DROP TABLE "person"`);
    await queryRunner.query(`DROP TYPE "person_gender_enum"`);
    await queryRunner.query(`DROP TABLE "relationship"`);
    await queryRunner.query(`DROP TYPE "relationship_relationship_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "user_defaultrole_enum"`);
    await queryRunner.query(`DROP TABLE "class_questionnaire"`);
    await queryRunner.query(`DROP TABLE "questionnaire"`);
    await queryRunner.query(
      `DROP TYPE "questionnaire_questionnairestatus_enum"`
    );
    await queryRunner.query(`DROP TYPE "questionnaire_questionnairetype_enum"`);
    await queryRunner.query(`DROP TABLE "programme_questionnaire"`);
    await queryRunner.query(`DROP TABLE "programme"`);
    await queryRunner.query(`DROP TABLE "questionnaire_window"`);
    await queryRunner.query(`DROP TABLE "question_set"`);
    await queryRunner.query(`DROP TABLE "question_order"`);
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TYPE "question_questiontype_enum"`);
    await queryRunner.query(`DROP TABLE "option"`);
  }
}
