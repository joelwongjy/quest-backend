import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";
import * as AttemptController from "../../controllers/AttemptController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.get("/", QuestionnaireController.index);

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.get("/:id/window/:windowId", QuestionnaireController.showWindow);

router.use(checkIfAdmin());
router.post("/create", QuestionnaireController.create);
router.delete("/delete/:id", QuestionnaireController.softDelete);
router.get("/:id", QuestionnaireController.show);
router.post("/edit/:id", QuestionnaireController.edit);

router.post("/submissions/create", AttemptController.create);
router.get("/submissions/:id", AttemptController.show);

export default router;
