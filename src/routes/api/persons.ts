import { Router } from "express";
import * as UsersController from "../../controllers/UsersController";
import * as PersonsController from "../../controllers/PersonsController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(checkIfAdmin);

router.post("/:id/user", UsersController.create);
router.get("/:id", PersonsController.showPerson);

export default router;
