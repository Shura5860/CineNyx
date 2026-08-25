import dotenv from 'dotenv';
dotenv.config({ path: './.env'});

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './helpers/connectDatabase.js';

const app = express();
const port = process.env.PORT || 3000;

// Routers İmports
import authRouter from "./routers/auth.js";
import uploadRouter from "./routers/upload.js";
import CountryRouter from "./routers/country.js";
import KindsRouter from "./routers/kinds.js";
import SoundOptionsRouter from "./routers/soundOptions.js";
import SubtitleOptionsRouter from "./routers/subtitleOption.js";
import ContentRouter from "./routers/content.js";
import CommentRouter from "./routers/comment.js";
import OpenSubtitlesRouter from "./routers/opensubtitles.js";
import UserRouter from "./routers/user.js";

// Middleware - credentials (cookie) için origin belirtmek gerek; localhost + 127.0.0.1 ikisini de kabul et
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (!isProduction) {
      callback(null, true); // Dev ortamında Postman / curl veya yerel testlere izin ver
    } else {
      callback(new Error('CORS policy: Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
connectDatabase();

// Routers
app.get('/', (req, res) => {
    res.send('<h1>Welcome İboylaizle.com</h1>');
});

app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/country', CountryRouter);
app.use('/api/kinds', KindsRouter);
app.use('/api/soundoptions', SoundOptionsRouter);
app.use('/api/subtitleoptions', SubtitleOptionsRouter);
app.use('/api/content', ContentRouter);
app.use('/api/comments', CommentRouter);
app.use('/api/opensubtitles', OpenSubtitlesRouter);
app.use('/api/users', UserRouter);

// Server
app.listen(port, () => {
    console.log('Server Started ' + port);
});