import express from "express";
import {createGroup, getGroupById, getGroupMemberDetails, joinGroup,} from "../controllers/GroupController.js";
import {
    createTransaction,
    deleteAllTransactionsInDB,
    deleteTransaction,
    getAllTransactionsInDB,
    getGroupTransactions,
    getTransactionById,
    settleTransaction,
    updateTransaction
} from "../controllers/TransactionController.js";

const groupRouter = express.Router()

groupRouter.get('/getAllTransactionsInDB', getAllTransactionsInDB)
groupRouter.post('/createGroup', createGroup)
groupRouter.post('/joinGroup', joinGroup)
groupRouter.post('/groupDetails', getGroupById)
groupRouter.post('/groupMemberDetails', getGroupMemberDetails)
groupRouter.post('/createTransaction', createTransaction)
groupRouter.put('/updateTransaction', updateTransaction)
groupRouter.post('/transactionDetails', getTransactionById)
groupRouter.post('/settleTransaction', settleTransaction)
groupRouter.post('/groupTransactionHistory', getGroupTransactions)
groupRouter.post('/deleteTransaction', deleteTransaction)
groupRouter.delete('/deleteAllTransactionsInDB', deleteAllTransactionsInDB)

export default groupRouter