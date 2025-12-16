import { Router } from "express";
import {
    createProfile,
    getProfile,
    getProfileByUsername,
    updateProfile,
    deleteProfile,
    getAllProfiles
} from "../controllers/profile.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Protected routes
router.route("/").post(verifyJWT, upload.single("logo"), createProfile);
router.route("/").get(verifyJWT, getProfile);
router.route("/").patch(verifyJWT, upload.single("logo"), updateProfile);
router.route("/").delete(verifyJWT, deleteProfile);

// Public routes
router.route("/:username").get(getProfileByUsername);

// Admin routes
router.route("/all/profiles").get(verifyJWT, isAdmin, getAllProfiles);

export default router;
