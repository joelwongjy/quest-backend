import { Router } from "express";
import { BearerTokenType } from "../../types/tokens";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import * as ClassesController from "../../controllers/ClassesController";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(checkIfAdmin());
router.post("/teachers", ClassesController.createTeacher);
router.post("/admins", ClassesController.createAdmin);
router.patch("/teachers/:id", ClassesController.editTeacher);
router.patch("/admins/:id", ClassesController.editAdmin);
router.get("/:id", ClassesController.show);
router.patch("/:id", ClassesController.edit);

export default router;
