import mongoose from "mongoose";
import { Schema } from "mongoose";
import slugify from "slugify";

export const KindSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a kind name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Kind name can not be more than 50 characters']
    },
    tmdbId: Number,
    slug: String
});

KindSchema.pre("save", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }
});

const Kind = mongoose.model("Kind", KindSchema);
export default Kind;