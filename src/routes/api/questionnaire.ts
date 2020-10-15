import { Router } from "express";
import * as QuestionnaireController from "../../controllers/QuestionnaireController";

export const router = Router();

router.post("/create", QuestionnaireController.create);

export default router;
