import express from "express";
import {getUserById, loginUser, registerUser} from "../controllers/UserController.js";
import {getUserPendingTransactions} from "../controllers/TransactionController.js";

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/userDetails', getUserById)
userRouter.post('/userPendingTransactions', getUserPendingTransactions)

export default userRouter