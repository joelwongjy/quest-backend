import { Router } from "express";
import * as AnnouncementsController from "../../controllers/AnnouncementsController";
import {
  checkBearerToken,
  checkIfAdmin,
} from "../../middlewares/checkBearerToken";
import { BearerTokenType } from "../../types/tokens";

export const router = Router();

router.use(checkBearerToken(BearerTokenType.AccessToken));
router.use(checkIfAdmin());

router.post("/", AnnouncementsController.create);
router.get("/:id", AnnouncementsController.show);
router.get("/", AnnouncementsController.index);
router.delete("/:id", AnnouncementsController.softDelete);
router.patch("/:id", AnnouncementsController.edit);

export default router;
