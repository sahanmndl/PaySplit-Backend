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
        ]
    }
);

const User = model('User', UserSchema);
export default User;