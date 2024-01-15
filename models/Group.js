import {model, Schema} from 'mongoose';

const GroupSchema = new Schema({
        name: {
            type: String,
            required: true,
        },
        inviteCode: {
            type: String,
            required: true,
            unique: true,
        },
        totalExpense: {
            type: Number,
            default: 0.0,
            required: true,
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        transactionHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Transaction'
            }
        ]
    },
    {
        timestamps: true
    }
)

const Group = model('Group', GroupSchema);

export default Group;
