import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";
import * as AttemptController from "../../controllers/AttemptController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.post("/submissions", AttemptController.create);
router.get("/submissions", AttemptController.index);
router.get("/submissions/:id", AttemptController.show);
router.get("/:id/submissions", AttemptController.showByQuestionnaire);

router.get("/:id/window/:windowId", QuestionnaireController.showWindow);
router.get("/:id", QuestionnaireController.show);
router.get("/", QuestionnaireController.index);

router.use(checkIfAdmin());
router.post("/create", QuestionnaireController.create);
router.delete("/delete/:id", QuestionnaireController.softDelete);
router.post("/edit/:id", QuestionnaireController.edit);

export default router;
