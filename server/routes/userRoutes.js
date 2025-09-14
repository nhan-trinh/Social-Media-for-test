import express from 'express'
import { accepteConnectionRequest, discoverUsers, followUser, getUserConnection, getUserData, getUserProfiles, sendConnectionRequest, unfollowUser, updateUserData } from '../controller/userController.js';
import { protect } from '../middleware/auth.js'
import { upload } from '../configs/multer.js';
import { getUserRececentMessages } from '../controller/messageController.js';

const userRouter = express.Router();

userRouter.get('/data', protect, getUserData)
userRouter.post('/update', upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]), protect, updateUserData)
userRouter.post('/discover', protect, discoverUsers)
userRouter.post('/follow', protect, followUser)
userRouter.post('/unfollow', protect, unfollowUser)
userRouter.post('/connect', protect, sendConnectionRequest)
userRouter.post('/accept', protect, accepteConnectionRequest)
userRouter.get('/connections', protect, getUserConnection)
userRouter.post('/profiles', protect, getUserProfiles)
userRouter.get('/recent-messages', protect, getUserRececentMessages)
export default userRouter