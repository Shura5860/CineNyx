import { Router } from "express";
import { getComments, createComment, deleteComment } from "../controllers/comment.js";

const router = Router();

router.get("/content/:contentId", getComments);
router.post("/", createComment);
router.delete("/:id", deleteComment);

export default router;
