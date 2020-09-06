import { Router } from "express";
import * as AuthController from "../../controllers/AuthController";

export const router = Router();

router.post("/token", AuthController.processToken);

export default router;
