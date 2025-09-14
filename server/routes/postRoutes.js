import express from 'express'
import { upload } from '../configs/multer.js'
import { protect } from '../middleware/auth.js'
import { 
  addPost, 
  getFeedPosts, 
  likePost, 
  deletePost, 
  updatePost, 
  // sharePost,
  // getSharedPosts
} from '../controller/postController.js'

const postRouter = express.Router()

postRouter.post('/add', upload.array('images', 4), protect, addPost)
postRouter.get('/feed', protect, getFeedPosts)
postRouter.post('/like', protect, likePost)
postRouter.post('/delete', protect, deletePost) // New route
postRouter.post('/update', protect, updatePost) // New route
// postRouter.post('/share', protect, sharePost)
// postRouter.get('/shares/:postId', protect, getSharedPosts)

export default postRouter