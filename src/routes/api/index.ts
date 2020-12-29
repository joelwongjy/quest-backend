import { Router } from "express";
import auth from "./auth";
import users from "./users";
import persons from "./persons";
import seed from "./seed";
import questionnaire from "./questionnaire";
import programmes from "./programmes";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/persons", persons);
routes.use("/seed", seed);
routes.use("/questionnaires", questionnaire);
routes.use("/programmes", programmes);

export default routes;
