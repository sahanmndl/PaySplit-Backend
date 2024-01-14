import bcrypt from "bcrypt";
import User from "../models/User.js";
import redisClient from "../middleware/Redis.js";
import {ON_LOAD} from "../utils/constants.js";

export const registerUser = async (req, res, next) => {
    try {
        const {email, name, password} = req.body

        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: 'User already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const newUser = await User.create({
            email: email,
            name: name,
            password: hashedPassword
        })

        await newUser.save()
        return res.status(200).json({user: newUser})
    } catch (e) {
        return res.status(404).json({message: "Cannot register user!"})
    }
}

export const loginUser = async (req, res, next) => {
    try {
        const {email, password} = req.body

        const existingUser = await User.findOne({email});
        if (!existingUser) return res.status(400).json({message: 'User does not exist'})

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)
        if (!isPasswordCorrect) return res.status(400).json({message: "Invalid credentials"})

        return res.status(200).json({message: "User authenticated!", user: existingUser})
    } catch (e) {
        return res.status(404).json({message: "Cannot login user!"})
    }
}

export const getUserById = async (req, res, next) => {
    try {
        const {userId, getType} = req.body

        const cacheKey = `user-${userId}`

        if (getType === ON_LOAD) {
            const cachedUser = await redisClient.get(cacheKey)
            if (cachedUser !== null) {
                return res.status(200).json({user: JSON.parse(cachedUser)});
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        await redisClient.setEx(cacheKey, 30, JSON.stringify(user))

        return res.status(200).json({user});
    } catch (e) {
        console.error(e)
        return res.status(500).json({message: 'Error retrieving user details'});
    }
};