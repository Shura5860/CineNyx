import { Router } from "express";
import { searchSubtitles, importSubtitle } from "../controllers/opensubtitles.js";

const router = Router();

router.post("/search", searchSubtitles);
router.post("/import", importSubtitle);

export default router;
