import { Router } from "express";
import {
  getAllCountries,
  getCountryBySlug,
  createCountry,
  updateCountry,
  deleteCountry,
  uploadCountryIcon
} from "../controllers/country.js";

import upload from "../middleware/upload.js";

const router = Router();

router.get("/", getAllCountries);
router.post("/", createCountry);
router.get("/:slug", getCountryBySlug);
router.put("/:slug", updateCountry);
router.delete("/:slug", deleteCountry);
router.post(
  "/:id/icon",
  upload("countries/icons").single("icon"),
  uploadCountryIcon
);

export default router;
