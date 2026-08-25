import mongoose from "mongoose";
import { Schema } from "mongoose";

export const UserHistorySchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    filmId: { type: mongoose.Types.ObjectId, ref: "Content", required: true },
    watchedAt: { type: Date, default: Date.now },
    isFinished: { type: Boolean, default: false },
    stayedMinutes: { type: Number, default: 0 },
});

const UserHistory = mongoose.model("UserHistory", UserHistorySchema);
export default UserHistory;