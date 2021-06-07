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

router.get("/:id", AnnouncementsController.show);
router.get("/", AnnouncementsController.index);
router.post("/create", AnnouncementsController.create);
router.delete("/delete/:id", AnnouncementsController.softDelete);

export default router;
