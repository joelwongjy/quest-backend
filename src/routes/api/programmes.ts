import { Router } from "express";
import * as ProgrammesController from "../../controllers/ProgrammesController";
import { checkBearerToken } from "../../middlewares/checkBearerToken";
import { findRelevantProgramClasses } from "../../middlewares/findRelevantEntities";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(findRelevantProgramClasses);
router.get("/", ProgrammesController.index);
router.get("/:id", ProgrammesController.show);

export default router;
