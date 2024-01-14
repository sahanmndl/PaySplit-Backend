import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./routes/UserRouter.js";
import groupRouter from "./routes/GroupRouter.js";
import redisClient from "./middleware/Redis.js";
import {rateLimiter} from "./middleware/RateLimiter.js";

dotenv.config()

const app = express()

app.use(cors())
app.use(rateLimiter)
app.use(express.json({limit: "30mb", extended: true}))
app.use('/api/user/', userRouter)
app.use('/api/group/', groupRouter)

mongoose
    .connect(
        process.env.MONGODB_URL,
        {useNewUrlParser: true, useUnifiedTopology: true}
    )
    .then(() => app.listen(process.env.PORT || 8008))
    .then(async () => {
        console.log("CONNECTED TO MONGODB THROUGH PORT 8008")
        await redisClient.connect()
            .then(() => console.log("CONNECTED TO REDIS"))
            .catch((e) => console.error("Redis connection error: ", e))
    })
    .catch((err) => {
        console.error("CONNECTION ERROR: ", err)
    });