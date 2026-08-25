import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";
import slugify from "slugify";
import crypto from "crypto";

export const UserSchema = new Schema({
    username: {
        type: String,
        required: [true, 'Please provide a name'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
            'Please provide a valid email'
        ]
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'moderator', 'admin']
    },
    password: {
        type: String,
        minlength: [6, 'Please provide a password with min length 6'],
        required: [true, 'Please provide a password'],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileImage: {
        type: String,
        default: 'default_profile.png'
    },
    blocked: {
        type: Boolean,
        default: false
    },
    emailVerifation: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type:String
    },
    resetPasswordExpire: {
        type: Date
    },
    favorites: [
        {
        type: mongoose.Schema.ObjectId,
        ref: 'Content'
        }
    ],
    history: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Content'
    }],
    requestList: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Content'
    }],
    favoriteType: {
        type: mongoose.Schema.ObjectId,
        ref: 'Types'
    },
    blockedContent: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Content'
    }],
    childMode: {
        type: Boolean,
        default: false
    },
    preferedImdb: {
        type: Number
    },
    slug: {
        type: String
    }
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


UserSchema.pre("save", function () {
  if (this.isModified("username") || this.isNew) {
    this.slug = this.makeSlug();
  }
});

UserSchema.methods.getResetPasswordToken = function () {
    const randomHexString = crypto.randomBytes(15).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(randomHexString).digest('hex');
    const resetPasswordExpire = Date.now() + parseInt(process.env.RESET_PASSWORD_EXPIRE);

    this.resetPasswordToken = resetPasswordToken;
    this.resetPasswordExpire = resetPasswordExpire;

    return resetPasswordToken;
}

UserSchema.methods.generateJwtToken = function () {
    const payload = {
        id: this._id,
        username: this.username
    }
    
    const expires = process.env.JWT_EXPIRE;

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: expires
    });

    return token;
}

UserSchema.methods.makeSlug = function () {
    return slugify(this.username, {
        replacement: '_',
        remove: /[*+~.()'"!:@]/g,
        lower: true,
        strict: false,
        locale: 'vi',
        trim: true
    });
}

const User = mongoose.model("User", UserSchema);
export default User;