import { Router } from "express";
import {
  getSubtitleOptionsByFilm,
  createSubtitleOption,
  uploadSubtitleFile,
  deleteSubtitleOption
} from "../controllers/subtitleOptions.js";

import upload from "../middleware/upload.js";

const router = Router();

router.get("/film/:filmId", getSubtitleOptionsByFilm);
router.post("/", createSubtitleOption);
router.post(
  "/:id/upload",
  upload("films/subtitles").single("subtitle"),
  uploadSubtitleFile
);
router.delete("/:id", deleteSubtitleOption);

export default router;
