import express from "express";
import {getUserById, loginUser, registerUser} from "../controllers/UserController.js";

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/userDetails', getUserById)

export default userRouter