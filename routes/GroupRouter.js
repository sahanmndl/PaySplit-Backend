import express from "express";
import {createGroup, getGroupById, joinGroup,} from "../controllers/GroupController.js";
import {createTransaction, deleteTransaction, updateTransaction} from "../controllers/TransactionController.js";

const groupRouter = express.Router()

groupRouter.post('/createGroup', createGroup)
groupRouter.post('/joinGroup', joinGroup)
groupRouter.post('/groupDetails', getGroupById)
groupRouter.post('/createTransaction', createTransaction)
groupRouter.put('/updateTransaction', updateTransaction)
groupRouter.delete('/deleteTransaction', deleteTransaction)

export default groupRouter