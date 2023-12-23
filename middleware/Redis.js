import {createClient} from 'redis';
import dotenv from "dotenv";

dotenv.config()

// Setup Redis client
const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

export default redisClient