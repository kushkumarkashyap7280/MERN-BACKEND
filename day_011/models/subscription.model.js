import { Schema, model } from "mongoose";
import User from "./user.model";


const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
