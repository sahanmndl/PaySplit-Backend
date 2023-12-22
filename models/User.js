import {model, Schema} from 'mongoose';

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true
        },
        groups: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Group'
            }
        ],
        createdTransactions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Transaction'
            }
        ],
        pendingTransactions: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Transaction'
            }
        ]
    },
    {
        timestamps: true
    }
);

const User = model('User', UserSchema);
export default User;