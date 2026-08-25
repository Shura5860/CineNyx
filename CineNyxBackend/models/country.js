import mongoose from "mongoose";
import { Schema } from "mongoose";
import slugify from "slugify";

export const CountrySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please provide a country name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Country name can not be more than 50 characters']
    },
    icon: {
        type: String
    },
    slug: String,
    tmdbCode: String,
    isCompleted: {
        type: Boolean,
        default: false
    }
});

CountrySchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }
  next();
});

const Country = mongoose.model("Country", CountrySchema);
export default Country;