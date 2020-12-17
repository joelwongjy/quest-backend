import { Router } from "express";
import * as UsersController from "../../controllers/UsersController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.get("/self", UsersController.showSelf);
router.patch("/self", UsersController.updateSelf);
router.patch("/change_password", UsersController.changePassword);

router.use(checkIfAdmin());
router.post("/person/:id/user", UsersController.create);

export default router;
