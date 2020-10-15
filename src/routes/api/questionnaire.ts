import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";

export const router = Router();

router.get("/questionnaires", QuestionnaireController.getQuestionnaireListData);

export default router;
