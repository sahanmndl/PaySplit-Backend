import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./routes/UserRouter.js";
import groupRouter from "./routes/GroupRouter.js";

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({limit: "30mb", extended: true}))
app.use('/api/user/', userRouter)
app.use('/api/group/', groupRouter)

mongoose
    .connect(
        `mongodb+srv://sahanmndl:sahan12345@paysplit-db-dev.1ezerae.mongodb.net/?retryWrites=true&w=majority`,
        {useNewUrlParser: true, useUnifiedTopology: true}
    )
    .then(() => app.listen(process.env.PORT || 8008))
    .then(() =>
        console.log("CONNECTED TO PORT 8008")
    )
    .catch((err) => console.log(err));