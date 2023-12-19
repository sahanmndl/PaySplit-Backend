import {model, Schema} from 'mongoose';

const TransactionSchema = new Schema({
    group: {
        type: String,
        required: true,
    },
    creator: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    participants: [
        {
            user: {
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
});

const Transaction = model('Transaction', TransactionSchema);

export default Transaction;
