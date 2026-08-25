import mongoose from "mongoose";
import { Schema } from "mongoose";

export const SoundOptionSchema = new Schema({
    filmId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: [true, 'Please provide a film ID']
    },
    language: {
        type: String,
        required: [true, 'Please provide a sound language'],
        trim: true,
        maxlength: [30, 'Sound language can not be more than 30 characters']
    },
    path: {
        type: String,
        default: null
    }
});

const SoundOption = mongoose.model("SoundOption", SoundOptionSchema);
export default SoundOption;