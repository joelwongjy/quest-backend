import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";
import { checkBearerToken } from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.get("/questionnaires", QuestionnaireController.getQuestionnaireListData);

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.post("/create", QuestionnaireController.create);

export default router;
