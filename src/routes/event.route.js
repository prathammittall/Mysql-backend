import { Router } from "express";
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    searchEvents
} from "../controllers/event.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public routes
router.route("/events").get(getAllEvents);
router.route("/events/:id").get(getEventById);
router.route("/events/search").get(searchEvents);

// Admin routes
router.route("/events").post(verifyJWT, isAdmin, upload.single("poster"), createEvent);
router.route("/events/:id").patch(verifyJWT, isAdmin, upload.single("poster"), updateEvent);
router.route("/events/:id").delete(verifyJWT, isAdmin, deleteEvent);

export default router;
