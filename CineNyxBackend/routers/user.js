import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  toggleUserBlock,
  deleteUser,
  getUserStats
} from "../controllers/user.js";

const router = Router();

router.get("/", getUsers);
router.get("/stats", getUserStats);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/block", toggleUserBlock);
router.delete("/:id", deleteUser);

export default router;
