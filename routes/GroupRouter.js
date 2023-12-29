import express from "express";
import {createGroup, getGroupById, joinGroup,} from "../controllers/GroupController.js";
import {
    createTransaction,
    deleteAllTransactionsInDB,
    deleteTransaction,
    getTransactionById,
    settleTransaction,
    updateTransaction
} from "../controllers/TransactionController.js";

const groupRouter = express.Router()

groupRouter.post('/createGroup', createGroup)
groupRouter.post('/joinGroup', joinGroup)
groupRouter.post('/groupDetails', getGroupById)
groupRouter.post('/createTransaction', createTransaction)
groupRouter.put('/updateTransaction', updateTransaction)
groupRouter.post('/transactionDetails', getTransactionById)
groupRouter.post('/settleTransaction', settleTransaction)
groupRouter.delete('/deleteTransaction', deleteTransaction)
groupRouter.delete('/deleteAllTransactionsInDB', deleteAllTransactionsInDB)

export default groupRouter