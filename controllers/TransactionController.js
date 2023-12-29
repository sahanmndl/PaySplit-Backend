import User from "../models/User.js";
import Group from "../models/Group.js";
import Transaction from "../models/Transaction.js";

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

        creator.createdTransactions.push(transaction);
        group.transactionHistory.push(transaction)
        for (const participant of participants) {
            const user = await User.findById(participant.userId);
            if (user) {
                user.pendingTransactions.push(transaction);
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
        const {transactionId, creatorId} = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({message: 'Transaction not found'});
        }

        if (transaction.creator.toString() !== creatorId) {
            return res.status(403).json({message: 'User is not the creator of the transaction'});
        }

        const usersToUpdate = await User.find({_id: {$in: transaction.participants.map(p => p.userId)}});
        for (const userToUpdate of usersToUpdate) {
            userToUpdate.pendingTransactions = userToUpdate.pendingTransactions.filter(pt => pt.toString() !== transactionId);
            await userToUpdate.save();
        }

        const creator = await User.findById(creatorId);
        creator.createdTransactions = creator.createdTransactions.filter(pt => pt.toString() !== transactionId);
        await creator.save();

        await Transaction.findByIdAndDelete(transactionId);

        return res.status(200).json({message: 'Transaction deleted successfully'});
    } catch (e) {
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

        const participantIndex = transaction.participants.findIndex(
            (participant) => participant.userId === userId
        );

        if (participantIndex === -1) {
            return res.status(404).json({message: 'Participant not found in the transaction'});
        }

        const paid = transaction.participants[participantIndex].paid
        if (paid) {
            user.pendingTransactions.push(transaction)
        } else {
            user.pendingTransactions = user.pendingTransactions.filter(pt => pt.toString() !== transactionId)
        }

        transaction.participants[participantIndex].paid = !paid

        await user.save()
        await transaction.save()

        return res.status(200).json({transaction})
    } catch (e) {
        return res.status(500).json({message: 'Error settling transaction'})
    }
};


//Developer Functions

export const deleteAllTransactionsInDB = async (req, res, next) => {
    try {
        await Transaction.deleteMany({});

        const users = await User.find({});
        for (const user of users) {
            user.pendingTransactions = [];
            user.createdTransactions = [];
            await user.save();
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
