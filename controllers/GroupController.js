import {customAlphabet} from "nanoid";
import Group from "../models/Group.js";
import User from "../models/User.js";
import {ON_LOAD} from "../utils/constants.js";
import redisClient from "../middleware/Redis.js";

export const createGroup = async (req, res, next) => {
    try {
        const {name, userId} = req.body;

        const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 7)
        const inviteCode = nanoid()

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const newGroup = await Group.create({
            name: name,
            inviteCode: inviteCode,
            members: [user._id]
        });

        user.groups.push(newGroup);
        await user.save();

        return res.status(200).json({group: newGroup});
    } catch (e) {
        return res.status(500).json({message: 'Error creating group'});
    }
}

export const joinGroup = async (req, res, next) => {
    try {
        const {inviteCode, userId} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const group = await Group.findOne({inviteCode});
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        if (group.members.includes(user._id)) {
            return res.status(400).json({message: 'User is already a member of the group'});
        }

        group.members.push(user);
        await group.save();
        user.groups.push(group);
        await user.save();

        return res.status(200).json({message: 'Successfully joined group', group});
    } catch (e) {
        return res.status(500).json({message: 'Error joining group'});
    }
};

export const getGroupById = async (req, res, next) => {
    try {
        const {groupId} = req.body

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        return res.status(200).json({group});
    } catch (e) {
        return res.status(500).json({message: 'Error retrieving group details'});
    }
}

export const getGroupMemberDetails = async (req, res, next) => {
    try {
        const {groupId, getType} = req.body

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        const cacheKey = `group-members-${groupId}`

        if (getType === ON_LOAD) {
            const cachedMembers = await redisClient.get(cacheKey)
            if (cachedMembers !== null) {
                console.log("CACHED GROUP MEMBERS RESPONSE: ", cacheKey)
                return res.status(200).json({members: JSON.parse(cachedMembers)});
            }
        }

        const groupMembers = group.members.map((userId) => {
            return User.findById(userId)
        })

        const resolvedMembers = await Promise.all(groupMembers)

        await redisClient.setEx(cacheKey, 30, JSON.stringify(resolvedMembers))

        return res.status(200).json({members: resolvedMembers});
    } catch (e) {
        return res.status(500).json({message: 'Error retrieving group member details'});
    }
}