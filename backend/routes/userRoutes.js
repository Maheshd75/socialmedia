import express from "express";
import { protect } from "../middlewares/auth.js";
import { acceptConnectionRequest, discoverUsers, followUser, getUserConnections, getUserDate, getUserProfiles, sendConnectionRequest, unfollowUser, updateUserDate } from "../controllers/userController.js";
import { upload } from "../configs/multer.js";
import e from "express";
import { getUserRecentMessages } from "../controllers/messageController.js";


const userRouter = express.Router();

userRouter.get('/data',protect,getUserDate)
userRouter.post('/update',upload.fields([{name:'profile',maxCount:1},{name:'cover',maxCount:1}]), protect,updateUserDate)
userRouter.post('/discover',protect,discoverUsers)
userRouter.post('/follow',protect,followUser)
userRouter.post('/unfollow',protect,unfollowUser)
userRouter.post('/connect',protect,sendConnectionRequest)
userRouter.post('/accept',protect,acceptConnectionRequest)
userRouter.get('/connections',protect,getUserConnections)
userRouter.post('/profiles',getUserProfiles)
userRouter.get('/recent-messages',protect,getUserRecentMessages)
export default userRouter;