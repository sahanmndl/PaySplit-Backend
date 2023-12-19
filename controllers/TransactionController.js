import User from "../models/User.js";
import Group from "../models/Group.js";
import Transaction from "../models/Transaction.js";

export const createTransaction = async (req, res, next) => {
    try {
        const {creatorId, groupId, description, participants} = req.body

        const creator = await User.findById(creatorId);
        if (!creator) {
            return res.status(404).json({message: 'User not found'});
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        if (!group.members.includes(creator._id)) {
            return res.status(403).json({message: 'User is not a member of the group'});
        }

        const transaction = await Transaction.create({
            group: groupId,
            creator: creatorId,
            description: description,
            participants: participants,
        })

        creator.pendingTransactions.push(transaction);
        for (const participant of participants) {
            const user = await User.findById(participant.user);
            if (user) {
                user.pendingTransactions.push(transaction);
                await user.save();
            }
        }

        await creator.save();
        await transaction.save();

        return res.status(200).json({transaction});
    } catch (e) {
        return res.status(500).json({message: 'Error creating transaction'});
    }
}

export const updateTransaction = async (req, res, next) => {
    try {
        const {transactionId, creatorId, description, participants} = req.body

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        if (transaction.creator.toString() !== creatorId) {
            return res.status(403).json({message: 'User is not the creator of the transaction'});
        }

        transaction.description = description;
        transaction.participants = participants;

        await transaction.save();

        return res.status(200).json({transaction});
    } catch (e) {
        return res.status(500).json({message: 'Error updating transaction'});
    }
}

export const deleteTransaction = async (req, res, next) => {
    try {
        const {transactionId, creatorId} = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        if (transaction.creator.toString() !== creatorId) {
            return res.status(403).json({message: 'User is not the creator of the transaction'});
        }

        const usersToUpdate = await User.find({_id: {$in: transaction.participants.map(p => p.user)}});
        for (const userToUpdate of usersToUpdate) {
            userToUpdate.pendingTransactions = userToUpdate.pendingTransactions.filter(pt => pt.toString() !== transactionId);
            await userToUpdate.save();
        }

        const creator = await User.findById(creatorId);
        creator.pendingTransactions = creator.pendingTransactions.filter(pt => pt.toString() !== transactionId);
        await creator.save();

        await Transaction.findByIdAndDelete(transactionId);

        return res.status(200).json({message: 'Transaction deleted successfully'});
    } catch (e) {
        return res.status(500).json({message: 'Error deleting transaction'});
    }
}