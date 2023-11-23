import { Schema, model } from 'mongoose';

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
            ref: 'User',
        },
    ],
});

const Group = model('Group', GroupSchema);

export default Group;
