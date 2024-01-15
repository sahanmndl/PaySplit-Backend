import User from "../models/User.js";
import Group from "../models/Group.js";
import Transaction from "../models/Transaction.js";
import {ON_LOAD} from "../utils/constants.js";
import redisClient from "../middleware/Redis.js";

export const createTransaction = async (req, res, next) => {
    try {
        const {creatorId, groupId, title, totalAmount, participants} = req.body

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
            groupId: groupId,
            creatorId: creatorId,
            title: title,
            totalAmount: totalAmount,
            participants: participants,
        })

        let sum = 0
        participants.map((pt) => sum += pt.amount)

        creator.createdTransactions.push(transaction)
        creator.totalPaid += totalAmount
        creator.totalExpense += (totalAmount - sum)
        creator.totalReturn += sum

        group.transactionHistory.push(transaction)
        group.totalExpense += totalAmount

        for (const participant of participants) {
            const user = await User.findById(participant.userId);
            if (user) {
                user.pendingTransactions.push(transaction)
                user.totalExpense += participant.amount
                user.totalOwe += participant.amount
                await user.save();
            }
        }

        await creator.save();
        await group.save()
        await transaction.save();

        return res.status(200).json({transaction});
    } catch (e) {
        return res.status(500).json({message: 'Error creating transaction'});
    }
}

export const updateTransaction = async (req, res, next) => {
    try {
        const {transactionId, creatorId, title, totalAmount, participants} = req.body

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        if (transaction.creator.toString() !== creatorId) {
            return res.status(403).json({message: 'User is not the creator of the transaction'});
        }

        transaction.title = title
        transaction.totalAmount = totalAmount
        transaction.participants = participants

        await transaction.save()

        return res.status(200).json({transaction});
    } catch (e) {
        return res.status(500).json({message: 'Error updating transaction'});
    }
}

export const deleteTransaction = async (req, res, next) => {
    try {
        const {transactionId, creatorId, groupId} = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        const creator = await User.findById(creatorId)
        if (!transaction) {
            return res.status(404).json({message: 'Creator not found'});
        }

        const group = await Group.findById(groupId)
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        if (transaction.creatorId.toString() !== creatorId) {
            return res.status(403).json({message: 'User is not the creator of the transaction'});
        }

        let sum = 0
        transaction.participants.map((pt) => sum += pt.amount)

        creator.createdTransactions = creator.createdTransactions.filter(pt => pt.toString() !== transactionId)
        creator.totalPaid -= transaction.totalAmount
        creator.totalExpense -= (transaction.totalAmount - sum)

        group.transactionHistory = group.transactionHistory.filter(pt => pt.toString() !== transactionId)
        group.totalExpense -= transaction.totalAmount

        const usersToUpdate = await User.find({_id: {$in: transaction.participants.map(p => p.userId)}});
        for (const userToUpdate of usersToUpdate) {
            if (userToUpdate) {
                const participant = transaction.participants.find(p => String(p.userId) === String(userToUpdate._id));
                if (participant) {
                    userToUpdate.totalExpense -= participant.amount;
                    if (!participant.paid) {
                        userToUpdate.totalOwe -= participant.amount;
                    } else {
                        creator.totalReturn += participant.amount
                    }
                    userToUpdate.pendingTransactions = userToUpdate.pendingTransactions.filter(pt => pt.toString() !== transactionId);
                    await userToUpdate.save();
                }
            }
        }

        creator.totalReturn -= sum

        await creator.save()
        await group.save()
        await Transaction.findByIdAndDelete(transactionId)

        return res.status(200).json({message: 'Transaction deleted successfully'});
    } catch (e) {
        console.error(e)
        return res.status(500).json({message: 'Error deleting transaction'});
    }
}

export const getTransactionById = async (req, res, next) => {
    try {
        const {transactionId, userId} = req.body

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // const cacheKey = `transaction-${transactionId}`
        //
        // const cachedTransaction = await redisClient.get(cacheKey)
        // if (cachedTransaction !== null) {
        //     return res.status(200).json({transaction: JSON.parse(cachedTransaction)});
        // }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        //await redisClient.setEx(cacheKey, 30, JSON.stringify(transaction))

        return res.status(200).json({transaction});
    } catch (e) {
        console.error(e)
        return res.status(500).json({message: 'Error fetching transaction details'});
    }
}

export const settleTransaction = async (req, res, next) => {
    try {
        const {userId, transactionId} = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }

        const creator = await User.findById(transaction.creatorId)
        if (!creator) {
            return res.status(404).json({message: "Creator not found"})
        }

        const participantIndex = transaction.participants.findIndex((participant) => participant.userId === userId)
        if (participantIndex === -1) {
            return res.status(404).json({message: 'Participant not found in the transaction'});
        }

        const paid = transaction.participants[participantIndex].paid
        const amount = transaction.participants[participantIndex].amount
        if (paid) {
            user.pendingTransactions.push(transaction)
            user.totalOwe += amount
            creator.totalReturn += amount
        } else {
            user.pendingTransactions = user.pendingTransactions.filter(pt => pt.toString() !== transactionId)
            user.totalOwe -= amount
            creator.totalReturn -= amount
        }

        transaction.participants[participantIndex].paid = !paid

        await user.save()
        await creator.save()
        await transaction.save()

        return res.status(200).json({transaction})
    } catch (e) {
        return res.status(500).json({message: 'Error settling transaction'})
    }
};

export const getGroupTransactions = async (req, res, next) => {
    try {
        const {groupId, userId, getType} = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({message: 'Group not found'});
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        if (!group.members.includes(user._id)) {
            return res.status(403).json({message: 'User is not a member of the group'});
        }

        const cacheKey = `group-transactions-${groupId}`

        if (getType === ON_LOAD) {
            const cachedTransactions = await redisClient.get(cacheKey)
            if (cachedTransactions !== null) {
                console.log("CACHED GROUP TRANSACTIONS RESPONSE: ", cacheKey)
                return res.status(200).json({transactionHistory: JSON.parse(cachedTransactions)});
            }
        }

        const transactionHistory = group.transactionHistory.map((transactionId) => {
            return Transaction.findById(transactionId);
        });

        const resolvedTransactions = await Promise.all(transactionHistory);

        await redisClient.setEx(cacheKey, 30, JSON.stringify(resolvedTransactions))

        return res.status(200).json({transactionHistory: resolvedTransactions});
    } catch (e) {
        console.error(e);
        return res.status(500).json({message: 'Error fetching group transaction history'});
    }
};

export const getUserPendingTransactions = async (req, res, next) => {
    try {
        const {userId, getType} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const cacheKey = `user-pending-transactions-${userId}`
        if (getType === ON_LOAD) {
            const cachedTransactions = await redisClient.get(cacheKey)
            if (cachedTransactions !== null) {
                console.log("CACHED USER PENDING TRANSACTIONS: ", cacheKey)
                return res.status(200).json({pendingTransactions: JSON.parse(cachedTransactions)});
            }
        }

        const pendingTransactions = user.pendingTransactions.map((transactionId) => {
            return Transaction.findById(transactionId);
        });

        const resolvedTransactions = await Promise.all(pendingTransactions);

        await redisClient.setEx(cacheKey, 30, JSON.stringify(resolvedTransactions))

        return res.status(200).json({pendingTransactions: resolvedTransactions});
    } catch (e) {
        console.error(e);
        return res.status(500).json({message: 'Error fetching user pending transactions'});
    }
};


//Developer Functions

export const deleteAllTransactionsInDB = async (req, res, next) => {
    try {
        await Transaction.deleteMany({});

        const users = await User.find({});
        for (const user of users) {
            user.totalExpense = 0
            user.pendingTransactions = []
            user.createdTransactions = []
            await user.save()
        }

        const groups = await Group.find({})
        for (const grp of groups) {
            grp.transactionHistory = []
            await grp.save()
        }

        return res.status(200).json({message: 'All transactions deleted successfully'});
    } catch (e) {
        return res.status(500).json({message: 'Error deleting transactions'});
    }
}

export const getAllTransactionsInDB = async (req, res, next) => {
    try {
        const transactions = await Transaction.find({});
        return res.status(200).json({transactions});
    } catch (e) {
        return res.status(500).json({message: 'Error fetching transactions'});
    }
};