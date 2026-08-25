import mongoose from "mongoose";

export const connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((err) => {
        console.log(`MongoDb Error: ${err}`)
    });
};