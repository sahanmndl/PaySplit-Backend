import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userRouter from "./routes/UserRouter.js";
import groupRouter from "./routes/GroupRouter.js";
import {rateLimit} from 'express-rate-limit';
import redisClient from "./middleware/Redis.js";

dotenv.config()

// Rate limit to 100 API requests in 1 minute per IP address
const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later'
})

const app = express()

app.use(cors())
app.use(limiter)
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