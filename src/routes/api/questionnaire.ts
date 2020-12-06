import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.get("/", QuestionnaireController.index);

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(checkIfAdmin());
router.post("/create", QuestionnaireController.create);
router.delete("/delete/:id", QuestionnaireController.softDelete);

export default router;
