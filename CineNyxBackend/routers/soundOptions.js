import { Router } from "express";
import {
  getSoundOptionsByFilm,
  createSoundOption,
  uploadSoundFile,
  deleteSoundOption,
  uploadSoundFromVideo
} from "../controllers/soundOption.js";

import upload from "../middleware/upload.js";

const router = Router();

router.get("/film/:filmId", getSoundOptionsByFilm);
router.post("/", createSoundOption);
router.post(
  "/:id/upload",
  upload("films/audio").single("audio"),
  uploadSoundFile
);
router.post(
  "/:id/upload-from-video",
  upload("films/temp-video").single("video"),
  uploadSoundFromVideo
);
router.delete("/:id", deleteSoundOption);

export default router;
