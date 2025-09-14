import express from 'express'
import { protect } from '../middleware/auth.js'
import { 
  addComment, 
  getPostComments, 
  likeComment, 
  deleteComment, 
  updateComment,
  syncCommentsCount, 
  addCommentToShare,
  getPostCommentShare
} from '../controller/commentController.js'

const commentRouter = express.Router()

commentRouter.post('/add', protect, addComment)
commentRouter.get('/:postId', protect, getPostComments)
commentRouter.post('/like', protect, likeComment)
commentRouter.post('/delete', protect, deleteComment)
commentRouter.post('/update', protect, updateComment)
commentRouter.post('/addshare', protect, addCommentToShare)
commentRouter.get('/share/:shareId', protect, getPostCommentShare)

// Route tùy chọn để sync lại comments count (chỉ dùng khi cần thiết)
commentRouter.post('/sync-count', protect, syncCommentsCount)

export default commentRouter