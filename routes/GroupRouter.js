import express from "express";
import {createGroup, getGroupById, joinGroup} from "../controllers/GroupController.js";

const groupRouter = express.Router()

groupRouter.post('/createGroup', createGroup)
groupRouter.post('/joinGroup', joinGroup)
groupRouter.post('/groupDetails', getGroupById)

export default groupRouter