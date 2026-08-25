import { Router } from "express";
import {
  getKinds,
  getKindBySlug,
  createKind,
  updateKind,
  deleteKind
} from "../controllers/kinds.js";

const router = Router();

router.get("/", getKinds);
router.post("/", createKind);
router.get("/:slug", getKindBySlug);
router.put("/:slug", updateKind);
router.delete("/:slug", deleteKind);

export default router;
