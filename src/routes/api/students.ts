import { Router } from "express";
import * as PersonsController from "../../controllers/PersonsController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(checkIfAdmin());

router.post("/", PersonsController.createStudent);
router.get("/", PersonsController.indexStudent);
router.get("/details", PersonsController.indexDetailedStudent);
router.delete("/", PersonsController.deleteStudent);

export default router;
