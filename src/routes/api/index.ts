import { Router } from "express";
import auth from "./auth";
import users from "./users";
import seed from "./seed";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", users);
routes.use("/seed", seed);

export default routes;
