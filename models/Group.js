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
});

const Group = model('Group', GroupSchema);

export default Group;
