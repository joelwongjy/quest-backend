import { Router } from "express";
import auth from "./auth";
import users from "./users";
import seed from "./seed";
import questionnaire from "./questionnaire";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/seed", seed);
routes.use("/questionnaires", questionnaire);

export default routes;
