import { Router } from "express";
import {
  createContent,
  getContents,
  getContentBySlug,
  updateContent,
  deleteContent,
  uploadCoverImage,
  publishContent,
  addEpisode,
  uploadContentVideo,
  getContentById,
  uploadContentSubtitle,
  uploadContentAudio,
  searchContent,
  createContentAuto,
  getEpisodesBySerieId
} from "../controllers/content.js";

import { uploadContentMedia } from "../middleware/upload.js";

const router = Router();

router.get("/", getContents);
router.get("/episodes/:serieId", getEpisodesBySerieId);
router.get("/:slug", getContentBySlug);
router.get("/id/:id", getContentById);
router.post("/", createContent);
router.put("/:id", updateContent);
router.delete("/:id", deleteContent);
router.post(
  "/:id/cover",
  uploadContentMedia("images").single("cover"),
  uploadCoverImage
);
router.post("/episode", addEpisode);
router.post("/:id/publish", publishContent);
router.post(
  "/:id/video",
  uploadContentMedia("videos").single("video"),
  uploadContentVideo
);
router.post(
  "/:id/subtitle",
  uploadContentMedia("subtitles").single("subtitle"),
  uploadContentSubtitle
);
router.post(
  "/:id/audio",
  uploadContentMedia("sounds").single("audio"),
  uploadContentAudio
);
router.post("/search", searchContent);
router.post("/importtmdb", createContentAuto);

export default router;
