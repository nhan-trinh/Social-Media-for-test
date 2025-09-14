# Real-time Notification System

This document describes the implementation of a real-time notification system using Socket.IO for the social media application.

## Features

### Real-time Notifications
- **Like notifications**: When someone likes your post, comment, or share
- **Comment notifications**: When someone comments on your post or share
- **Reply notifications**: When someone replies to your comment
- **Share notifications**: When someone shares your post
- **Follow notifications**: When someone starts following you
- **New post notifications**: When someone you follow creates a new post
- **New story notifications**: When someone you follow creates a new story

### UI Features
- Real-time notification counter in sidebar
- Notification feed page with pagination
- Mark as read functionality
- Delete notifications
- Toast notifications for new events
- Responsive design with dark mode support

## Technical Implementation

### Backend (Server)

#### Models
- **Notification.js**: MongoDB schema for storing notifications
  - Fields: user, from_user, type, post, comment, share, story, message, is_read, metadata

#### Services
- **notificationService.js**: Handles creating and sending notifications
  - Functions for each notification type
  - Socket.IO integration for real-time delivery

#### Controllers Updated
- **postController.js**: Added notifications for likes and new posts
- **commentController.js**: Added notifications for comments, replies, and likes
- **shareController.js**: Added notifications for shares and likes
- **userController.js**: Added notifications for follows
- **storyController.js**: Added notifications for new stories

#### Routes
- **notificationRoutes.js**: API endpoints for managing notifications
  - GET /api/notification - Get paginated notifications
  - GET /api/notification/unread-count - Get unread count
  - PATCH /api/notification/:id/read - Mark as read
  - PATCH /api/notification/mark-all-read - Mark all as read
  - DELETE /api/notification/:id - Delete notification

#### Socket.IO Setup
- Real-time communication between server and clients
- User-specific rooms for targeted notifications
- CORS configuration for client connections

### Frontend (Client)

#### Contexts
- **SocketContext.jsx**: Manages Socket.IO connection
- **NotificationContext.jsx**: Manages notification state and API calls

#### Components
- **NotificationsCard.jsx**: Individual notification display component
- **NotificationsFeed.jsx**: Complete notification feed page
- **Menuitems.jsx**: Updated with notification counter

#### Features
- Real-time updates via Socket.IO
- Automatic reconnection handling
- Toast notifications for new events
- Pagination for notification history
- Mark as read/delete functionality

## Usage

### Starting the System

1. **Server**: The notification system is automatically enabled when the server starts
2. **Client**: Socket connection is established automatically when user logs in

### Testing Notifications

1. **Like a post**: Like any post to trigger a notification to the post owner
2. **Comment on a post**: Comment on any post to trigger a notification
3. **Follow a user**: Follow someone to trigger a notification
4. **Create a post**: Create a post to notify all your followers
5. **Create a story**: Create a story to notify all your followers

### Notification Types

- `like_post`: Someone liked your post
- `like_comment`: Someone liked your comment
- `like_share`: Someone liked your share
- `comment_post`: Someone commented on your post
- `comment_share`: Someone commented on your share
- `reply_comment`: Someone replied to your comment
- `share_post`: Someone shared your post
- `follow`: Someone started following you
- `new_post`: Someone you follow created a new post
- `new_story`: Someone you follow created a new story

## Configuration

### Environment Variables

Server:
- `CLIENT_URL`: Frontend URL for CORS configuration
- `PORT`: Server port (default: 4000)

Client:
- `VITE_BASEURL`: Backend API URL

### Dependencies

Server:
- `socket.io`: Real-time communication
- `mongoose`: Database operations

Client:
- `socket.io-client`: Socket.IO client
- `date-fns`: Date formatting
- `react-hot-toast`: Toast notifications

## Future Enhancements

- Push notifications for mobile devices
- Email notifications for important events
- Notification preferences/settings
- Notification categories and filtering
- Batch operations for notifications
- Notification analytics and insights
