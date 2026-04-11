import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  markMessagesAsSeen,
  editMessage,
  deleteMessage,
} from "../controllers/messagecontroller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/seen/:id", protectRoute, markMessagesAsSeen);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/delete/:id", protectRoute, deleteMessage);

export default router;
