import { getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";
import { ClassQuestionnaire } from "../../entities/questionnaire/ClassQuestionnaire";
import { ProgrammeQuestionnaire } from "../../entities/questionnaire/ProgrammeQuestionnaire";
import { Questionnaire } from "../../entities/questionnaire/Questionnaire";
import {
  QUESTIONNAIRE_PROGRAMS_AND_CLASSES_CREATOR_ERROR,
  QUESTIONNAIRE_PROGRAMS_AND_CLASSES_EDITOR_ERROR,
} from "../../types/errors";
import { QuestionnairePostData } from "../../types/questionnaires";
import { QuestionnaireValidator } from "./questionnaire";

/** Shared type between `QuestionnaireProgrammesAndClassesRelations` and `Questionnaire` */
export type ProgrammeClassesQuestionnaires = {
  programmes: ProgrammeQuestionnaire[];
  classes: ClassQuestionnaire[];
};

/**Helper types */
type ProgrammeClasses = {
  programmes: Programme[];
  classes: Class[];
};
type Sets<Input, Existing> = {
  toAdd: Input[];
  toKeep: Existing[];
  toSoftDelete: Existing[];
};
type ProgrammeId = number;
type ShouldSoftDelete = boolean;
type WithId = { id: number };
type CurrentlySavedTuple<U> = [U, ShouldSoftDelete];

class QuestionnaireProgrammesAndClassesCreatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_PROGRAMS_AND_CLASSES_CREATOR_ERROR;
  }
}

class QuestionnaireProgrammesAndClassesEditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = QUESTIONNAIRE_PROGRAMS_AND_CLASSES_EDITOR_ERROR;
  }
}

export abstract class QuestionnaireProgrammesAndClassesBase {
  async getRequestedProgrammesAndClasses(
    programmesData: number[],
    classesData: number[]
  ): Promise<ProgrammeClasses> {
    const programmesOR = programmesData.map((id) => Object.assign({}, { id }));
    const classesOR = classesData.map((id) => Object.assign({}, { id }));

    // seems like with an [], typeorm will return everything
    const programmes =
      programmesOR.length === 0
        ? []
        : await getRepository(Programme).find({
            select: ["id"],
            where: programmesOR,
          });
    const classes =
      classesOR.length === 0
        ? []
        : await getRepository(Class).find({
            select: ["id"],
            where: classesOR,
          });

    if (programmesData.length !== programmes.length) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `One or more programmeIds given is invalid` +
          `(Received ${programmesData.length}. Found: ${programmes.length}`
      );
    }
    if (classesData.length !== classes.length) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `One or more classIds given is invalid ` +
          `(Received ${classesData.length}. Found: ${classes.length}`
      );
    }
    return { programmes, classes };
  }
}

export class QuestionnaireProgrammesAndClassesCreator extends QuestionnaireProgrammesAndClassesBase {
  private _qnnaire: Questionnaire;
  private programmes: number[];
  private classes: number[];

  constructor(programmes: number[], classes: number[], qnnaire: Questionnaire) {
    if (!qnnaire.id) {
      throw new QuestionnaireProgrammesAndClassesCreatorError(
        "Provided Questionnaire has no id"
      );
    }

    super();
    this._qnnaire = qnnaire;
    this.programmes = programmes;
    this.classes = classes;
  }

  public async createRelations(): Promise<ProgrammeClassesQuestionnaires> {
    const {
      programmes,
      classes,
    } = await super.getRequestedProgrammesAndClasses(
      this.programmes,
      this.classes
    );

    const programmesRelations = programmes.map(
      (programme) => new ProgrammeQuestionnaire(programme, this._qnnaire)
    );
    const classRelations = classes.map(
      (clazz) => new ClassQuestionnaire(clazz, this._qnnaire)
    );

    const newProgrammesRelations = await getRepository(
      ProgrammeQuestionnaire
    ).save(programmesRelations);
    const newClassesQnnaires = await getRepository(ClassQuestionnaire).save(
      classRelations
    );

    return { programmes: newProgrammesRelations, classes: newClassesQnnaires };
  }
}

/**
 * Edits the ProgrammeQuestionnaires and ClassesQuestionnaires.
 */
export class QuestionnaireProgrammesAndClassesEditor extends QuestionnaireProgrammesAndClassesBase {
  private validator: QuestionnaireValidator = new QuestionnaireValidator();
  private _qnnaire: Questionnaire; // do not use save on this directly

  private editData: Pick<QuestionnairePostData, "classes" | "programmes">;
  private programmeQuestionnaires: ProgrammeQuestionnaire[];
  private classQuestionnaires: ClassQuestionnaire[];

  constructor(
    qnnaire: Questionnaire,
    editData: Pick<QuestionnairePostData, "classes" | "programmes">
  ) {
    super();
    this.validator.validateQnnaireOrReject(qnnaire);
    this._qnnaire = qnnaire;
    this.editData = editData;

    this.programmeQuestionnaires = this._qnnaire.programmeQuestionnaires;
    this.classQuestionnaires = this._qnnaire.classQuestionnaires;
  }

  public async editProgrammesAndClasses(): Promise<ProgrammeClassesQuestionnaires> {
    const {
      programmes,
      classes,
    } = await super.getRequestedProgrammesAndClasses(
      this.editData.programmes,
      this.editData.classes
    );

    const organisedProgrammes: Sets<
      Programme,
      ProgrammeQuestionnaire
    > = this.organiseSets(programmes, this.programmeQuestionnaires);
    const organisedClasses: Sets<Class, ClassQuestionnaire> = this.organiseSets(
      classes,
      this.classQuestionnaires
    );

    const newProgrammeQnnaires = await this.updateProgrammeQuestionnaire(
      organisedProgrammes
    );
    const newClassesQnnaires = await this.updateClassQuestionnaire(
      organisedClasses
    );

    return {
      programmes: newProgrammeQnnaires,
      classes: newClassesQnnaires,
    };
  }

  private organiseSets<Input extends WithId, Existing extends WithId>(
    given: Input[],
    currentlySaved: Existing[]
  ): Sets<Input, Existing> {
    const toAdd: Input[] = [];
    const toKeep: Existing[] = [];
    const toSoftDelete: Existing[] = [];

    const currentlySavedMap: Map<
      ProgrammeId,
      CurrentlySavedTuple<Existing>
    > = new Map();
    currentlySaved.forEach((item) => {
      currentlySavedMap.set(item.id, [item, true]);
    });

    given.forEach((item) => {
      if (currentlySavedMap.has(item.id)) {
        // intersection of the 2 arrays
        const savedItem = currentlySavedMap.get(item.id)![0];

        toKeep.push(savedItem);
        currentlySavedMap.set(item.id, [savedItem, false]);
      }

      // only in given
      toAdd.push(item);
    });

    // only in currentlySaved
    currentlySavedMap.forEach((tuple) => {
      const shouldSoftDelete = tuple[1];
      if (shouldSoftDelete) {
        toSoftDelete.push(tuple[0]);
      }
    });

    return { toAdd, toKeep, toSoftDelete };
  }

  private verifyNothingDanglingOrReject<T>(
    newList: T[],
    existingList: T[]
  ): void {
    if (newList < existingList) {
      throw new QuestionnaireProgrammesAndClassesEditorError(
        `Operation will cause dangling association between Programme/Class-Questionnaire` +
          `(New list ${newList.length}. Existing list: ${existingList.length}`
      );
    }
  }

  private async updateProgrammeQuestionnaire(
    sets: Sets<Programme, ProgrammeQuestionnaire>
  ): Promise<ProgrammeQuestionnaire[]> {
    const { toAdd, toKeep, toSoftDelete } = sets;

    const toAddMapped = toAdd.map(
      (programme) => new ProgrammeQuestionnaire(programme, this._qnnaire)
    );
    const addedList = await getRepository(ProgrammeQuestionnaire).save(
      toAddMapped
    );

    const softDeletedList = await getRepository(
      ProgrammeQuestionnaire
    ).softRemove(toSoftDelete);

    const updatedProgrammeQnnaires = addedList
      .concat(toKeep)
      .concat(softDeletedList);

    this.verifyNothingDanglingOrReject(
      updatedProgrammeQnnaires,
      this.programmeQuestionnaires
    );
    return updatedProgrammeQnnaires;
  }

  private async updateClassQuestionnaire(
    sets: Sets<Class, ClassQuestionnaire>
  ): Promise<ClassQuestionnaire[]> {
    const { toAdd, toKeep, toSoftDelete } = sets;

    const toAddMapped = toAdd.map(
      (clazz) => new ClassQuestionnaire(clazz, this._qnnaire)
    );
    const addedList = await getRepository(ClassQuestionnaire).save(toAddMapped);

    const softDeletedList = await getRepository(ClassQuestionnaire).softRemove(
      toSoftDelete
    );

    const updatedClassesQnnaires = addedList
      .concat(toKeep)
      .concat(softDeletedList);

    this.verifyNothingDanglingOrReject(
      updatedClassesQnnaires,
      this.classQuestionnaires
    );
    return updatedClassesQnnaires;
  }
}
