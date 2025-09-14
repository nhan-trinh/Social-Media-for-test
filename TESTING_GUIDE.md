# Testing the Real-time Notification System

## Quick Start

### 1. Start the Server
```bash
cd server
npm run server
```

### 2. Start the Client
```bash
cd client
npm run dev
```

### 3. Test Notifications

#### Basic Setup
1. Open the application in your browser
2. Login with a user account
3. Open another browser tab/window (or use incognito mode)
4. Login with a different user account

#### Test Scenarios

**Scenario 1: Like Notifications**
1. User A creates a post
2. User B likes the post
3. User A should see a notification: "User B liked your post"

**Scenario 2: Comment Notifications**
1. User A creates a post
2. User B comments on the post
3. User A should see a notification: "User B commented on your post"

**Scenario 3: Follow Notifications**
1. User B follows User A
2. User A should see a notification: "User B started following you"

**Scenario 4: New Post Notifications**
1. User B follows User A
2. User A creates a new post
3. User B should see a notification: "User A created a new post"

**Scenario 5: New Story Notifications**
1. User B follows User A
2. User A creates a new story
3. User B should see a notification: "User A created a new story"

**Scenario 6: Share Notifications**
1. User A creates a post
2. User B shares the post
3. User A should see a notification: "User B shared your post"

**Scenario 7: Reply Notifications**
1. User A creates a post
2. User B comments on the post
3. User A replies to User B's comment
4. User B should see a notification: "User A replied to your comment"

## What to Look For

### Real-time Features
- ✅ Notifications appear instantly without page refresh
- ✅ Toast notifications show for new events
- ✅ Notification counter updates in sidebar
- ✅ Notifications page shows all notifications
- ✅ Mark as read functionality works
- ✅ Delete notifications works

### UI Elements
- ✅ Red notification badge on sidebar
- ✅ Notification counter shows correct number
- ✅ Different icons for different notification types
- ✅ User avatars and names in notifications
- ✅ Timestamps showing "X minutes ago"
- ✅ Unread notifications highlighted

### Error Handling
- ✅ Server starts without errors
- ✅ Socket.IO connection established
- ✅ No console errors in browser
- ✅ Graceful handling of connection issues

## Troubleshooting

### Server Issues
- Check if MongoDB is running
- Verify all dependencies are installed
- Check server console for errors
- Ensure port 4000 is available

### Client Issues
- Check browser console for errors
- Verify Socket.IO connection in Network tab
- Check if VITE_BASEURL is set correctly
- Clear browser cache if needed

### Notification Issues
- Verify users are following each other for post/story notifications
- Check if users are logged in with valid tokens
- Ensure Socket.IO connection is active
- Check server logs for notification creation errors

## API Testing

You can also test the notification API directly:

```bash
# Test server is running
curl http://localhost:4000/

# Test notification endpoints (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/notification
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/notification/unread-count
```

## Expected Behavior

1. **Immediate Notifications**: All notifications should appear instantly
2. **Toast Messages**: New notifications should show as toast messages
3. **Counter Updates**: Sidebar counter should update immediately
4. **Persistence**: Notifications should persist in the database
5. **Real-time Updates**: Multiple users should see updates simultaneously
6. **No Duplicates**: Same action shouldn't create duplicate notifications
7. **Self-Notifications**: Users shouldn't get notifications for their own actions
