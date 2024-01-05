import {model, Schema} from 'mongoose';

const TransactionSchema = new Schema({
        groupId: {
            type: String,
            required: true,
        },
        creatorId: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        totalAmount: {
            type: Number,
            default: 0,
            required: true
        },
        participants: [
            {
                userId: {
                    type: String,
                    required: true,
                },
                amount: {
                    type: Number,
                    default: 0,
                    required: true,
                },
                paid: {
                    type: Boolean,
                    default: false,
                    required: true
                }
            },
        ],
    },
    {
        timestamps: true
    }
);

const Transaction = model('Transaction', TransactionSchema);

export default Transaction;
