import { Router } from "express";
import upload from "../middleware/upload.js";
import { uploadSingle } from "../controllers/upload.js";

const router = Router();

router.post(
  "/film-image",
  upload("films/images").single("image"),
  uploadSingle
);

router.post(
  "/avatar",
  upload("users/avatars").single("avatar"),
  uploadSingle
);

router.post(
  "/subtitle",
  upload("media/subtitles").single("subtitle"),
  uploadSingle
);

router.post(
  "/audio",
  upload("media/audio").single("audio"),
  uploadSingle
);

export default router;
