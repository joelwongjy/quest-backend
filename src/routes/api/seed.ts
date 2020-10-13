import { Router } from "express";
import * as SeedController from "../../controllers/SeedController";

export const router = Router();

router.get("", SeedController.seed);

export default router;
