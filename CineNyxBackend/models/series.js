import mongoose from "mongoose";
import { Schema } from "mongoose";
import slugify from "slugify";

export const SeriesSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Please provide a series title'],
        unique: true,
        trim: true,
        maxlength: [100, 'Series title can not be more than 100 characters']
    },
    slug: String,
    seasonCount : {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [200, 'Short description can not be more than 200 characters']
    },
    coverImage: {
        type: String,
        default: 'default-cover.jpg'
    },
    releaseDate: {
        type: Date
    },
    episodes: [{
        type: Schema.Types.ObjectId,
        ref: 'Content'
    }],
});

SeriesSchema.pre("save", function () {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, { lower: true });
  }
});

const Series = mongoose.model("Series", SeriesSchema);
export default Series;