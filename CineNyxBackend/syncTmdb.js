import dotenv from 'dotenv';
dotenv.config({ path: './.env'});

import mongoose from "mongoose";
import { syncGenres } from "./Scripts/syncKinds.js";
import { syncCountries } from "./Scripts/syncCountrys.js";

await mongoose.connect(process.env.MONGO_URI);

await syncGenres();
await syncCountries();

console.log("🚀 TMDB seed işlemi bitti");
process.exit();
