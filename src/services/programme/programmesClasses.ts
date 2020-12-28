import { getRepository } from "typeorm";
import { Class } from "../../entities/programme/Class";
import { Programme } from "../../entities/programme/Programme";
import { ProgrammeListData } from "../../types/programmes";

export type ProgrammeClass = {
  programmes: Programme[];
  classes: Class[];
};

export class ProgrammeClassGetter {
  public async getProgrammesAndClass(
    programmeIds: number[],
    classIds: number[]
  ): Promise<ProgrammeClass> {
    const programmes =
      programmeIds.length === 0
        ? []
        : await getRepository(Programme).find({
            where: programmeIds.map((id) => {
              return { id };
            }),
          });
    const classes =
      classIds.length === 0
        ? []
        : await getRepository(Class).find({
            where: classIds.map((id) => {
              return { id };
            }),
          });

    return { programmes, classes };
  }

  public async getProgrammes(programmeIds: number[]): Promise<Programme[]> {
    const { programmes } = await this.getProgrammesAndClass(programmeIds, []);
    return programmes;
  }

  public async getClasses(classIds: number[]): Promise<Class[]> {
    const { classes } = await this.getProgrammesAndClass([], classIds);
    return classes;
  }

  public async getProgrammeList(
    programmeIds: number[]
  ): Promise<ProgrammeListData[]> {
    if (programmeIds.length === 0) {
      return [];
    }

    const programmesOR = programmeIds.map((id) => {
      return { id };
    });
    const query = await getRepository(Programme).find({
      where: programmesOR,
      relations: ["classes"],
    });
    const result = query.map((p) => {
      return {
        ...p.getBase(),
        name: p.name,
        classCount: p.classes.length,
      };
    });
    return result;
  }
}
