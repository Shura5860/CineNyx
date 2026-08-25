import mongoose from "mongoose";
import { Schema } from "mongoose";

export const CommentSchema = new Schema({
  contentId: {
    type: Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: [1000, 'Yorum en fazla 1000 karakter olabilir']
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;
