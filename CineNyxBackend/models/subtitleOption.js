import mongoose from "mongoose";
import { Schema } from "mongoose";

export const SubtitleOptionSchema = new Schema({
    filmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: [true, 'Please provide a film ID']
    },
    language: {
        type: String,
        required: [true, 'Please provide a subtitle language'],
        trim: true,
        maxlength: [30, 'Subtitle language can not be more than 30 characters']
    },
    path: {
        type: String,
        default: null
    }
});

const SubtitleOption = mongoose.model("SubtitleOption", SubtitleOptionSchema);
export default SubtitleOption;