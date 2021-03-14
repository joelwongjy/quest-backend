import { Router } from "express";
import auth from "./auth";
import users from "./users";
import persons from "./persons";
import seed from "./seed";
import questionnaire from "./questionnaire";
import programmes from "./programmes";
import students from "./students";
import classes from "./classes";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/persons", persons);
routes.use("/students", students);
routes.use("/seed", seed);
routes.use("/questionnaires", questionnaire);
routes.use("/programmes", programmes);
routes.use("/classes", classes);

export default routes;
