// // utils/sanitizeUser.js

// /**
//  * Sanitize user data based on different security levels and contexts
//  * @param {Object|Array} userData - User object or array of users
//  * @param {string} level - Security level: 'minimal', 'basic', 'profile', 'own', 'admin'
//  * @param {string} requesterId - ID of the user making the request (for relationship context)
//  * @returns {Object|Array} Sanitized user data
//  */
// export const sanitizeUser = (userData, level = 'basic', requesterId = null) => {
//   if (!userData) return null;

//   // Handle array of users
//   if (Array.isArray(userData)) {
//     return userData.map(user => sanitizeUser(user, level, requesterId));
//   }

//   // Convert mongoose document to plain object if needed
//   const user = userData.toObject ? userData.toObject() : userData;
  
//   // Define field sets for different security levels
//   const fieldSets = {
//     // Minimal - for public listings, search results
//     minimal: {
//       include: ['_id', 'username', 'full_name', 'profile_picture'],
//       exclude: ['email', 'password', '__v', 'connections', 'followers', 'following', 
//                 'createdAt', 'updatedAt', 'location', 'bio', 'cover_photo']
//     },
    
//     // Basic - for general API responses, follows, etc.
//     basic: {
//       include: ['_id', 'username', 'full_name', 'profile_picture', 'bio'],
//       exclude: ['email', 'password', '__v', 'connections', 'followers', 'following', 
//                 'createdAt', 'updatedAt']
//     },
    
//     // Profile - for viewing someone's profile
//     profile: {
//       include: ['_id', 'username', 'full_name', 'profile_picture', 'cover_photo', 
//                 'bio', 'location', 'followersCount', 'followingCount', 'connectionsCount'],
//       exclude: ['email', 'password', '__v', 'connections', 'followers', 'following', 
//                 'createdAt', 'updatedAt']
//     },
    
//     // Own - for user's own data
//     own: {
//       include: ['_id', 'username', 'full_name', 'profile_picture', 'cover_photo', 
//                 'bio', 'location', 'followersCount', 'followingCount', 'connectionsCount',
//                 'createdAt'],
//       exclude: ['email', 'password', '__v']
//     },
    
//     // Admin - for admin panel (still hide sensitive data)
//     admin: {
//       include: ['_id', 'username', 'full_name', 'profile_picture', 'bio', 'location',
//                 'followersCount', 'followingCount', 'connectionsCount', 'createdAt'],
//       exclude: ['password', '__v']
//     }
//   };

//   const currentLevel = fieldSets[level] || fieldSets.basic;
//   let sanitized = {};

//   // Include specified fields
//   currentLevel.include.forEach(field => {
//     if (user[field] !== undefined) {
//       sanitized[field] = user[field];
//     }
//   });

//   // Add computed fields based on level
//   if (['profile', 'own', 'admin'].includes(level)) {
//     // Add counts instead of actual arrays
//     sanitized.followersCount = user.followers?.length || 0;
//     sanitized.followingCount = user.following?.length || 0;
//     sanitized.connectionsCount = user.connections?.length || 0;
//   }

//   // Add relationship status if requester is provided and it's not the user's own data
//   if (requesterId && requesterId !== user._id?.toString() && ['profile', 'basic'].includes(level)) {
//     sanitized.relationshipStatus = {
//       isFollowing: user.followers?.includes(requesterId) || false,
//       isFollower: user.following?.includes(requesterId) || false,
//       isConnected: user.connections?.includes(requesterId) || false
//     };
//   }

//   // Sanitize URLs to remove sensitive query parameters
//   if (sanitized.profile_picture) {
//     sanitized.profile_picture = sanitizeImageUrl(sanitized.profile_picture);
//   }
//   if (sanitized.cover_photo) {
//     sanitized.cover_photo = sanitizeImageUrl(sanitized.cover_photo);
//   }

//   return sanitized;
// };

// /**
//  * Remove sensitive query parameters from image URLs
//  * @param {string} url - Image URL
//  * @returns {string} Sanitized URL
//  */
// const sanitizeImageUrl = (url) => {
//   if (!url) return url;
  
//   try {
//     const urlObj = new URL(url);
//     // Remove potentially sensitive query parameters
//     const sensitiveParams = ['token', 'signature', 'expires', 'user_id'];
//     sensitiveParams.forEach(param => urlObj.searchParams.delete(param));
//     return urlObj.toString();
//   } catch (error) {
//     // If URL parsing fails, return original URL
//     return url;
//   }
// };

// /**
//  * Sanitize user data specifically for posts/shares context
//  * @param {Object} userData - User object
//  * @returns {Object} Minimal user data for posts
//  */
// export const sanitizeUserForPost = (userData) => {
//   return sanitizeUser(userData, 'minimal');
// };

// /**
//  * Sanitize user data for search results
//  * @param {Array} users - Array of user objects
//  * @param {string} requesterId - ID of the user making the request
//  * @returns {Array} Sanitized users with relationship status
//  */
// export const sanitizeUsersForSearch = (users, requesterId) => {
//   return users.map(user => ({
//     ...sanitizeUser(user, 'basic', requesterId),
//     // Add preview of mutual connections count (without revealing who)
//     mutualConnectionsCount: getMutualConnectionsCount(user, requesterId)
//   }));
// };

// /**
//  * Get count of mutual connections without revealing identities
//  * @param {Object} user - User object
//  * @param {string} requesterId - Requester's ID
//  * @returns {number} Count of mutual connections
//  */
// const getMutualConnectionsCount = (user, requesterId) => {
//   if (!user.connections || !requesterId) return 0;
  
//   // This would need to be implemented with proper database query
//   // For now, return 0 as placeholder
//   return 0;
// };

// /**
//  * Batch sanitize with different levels
//  * @param {Object} data - Object containing different user data types
//  * @param {string} requesterId - Requester's ID
//  * @returns {Object} Sanitized data object
//  */
// export const batchSanitize = (data, requesterId) => {
//   const result = {};

//   if (data.profile) {
//     result.profile = sanitizeUser(data.profile, 'profile', requesterId);
//   }
  
//   if (data.posts) {
//     result.posts = data.posts.map(post => ({
//       ...post,
//       user: sanitizeUserForPost(post.user)
//     }));
//   }
  
//   if (data.shares) {
//     result.shares = data.shares.map(share => ({
//       ...share,
//       user: sanitizeUserForPost(share.user),
//       shared_post: {
//         ...share.shared_post,
//         user: sanitizeUserForPost(share.shared_post?.user)
//       }
//     }));
//   }
  
//   if (data.connections) {
//     result.connections = sanitizeUser(data.connections, 'basic', requesterId);
//   }
  
//   if (data.followers) {
//     result.followers = sanitizeUser(data.followers, 'basic', requesterId);
//   }
  
//   if (data.following) {
//     result.following = sanitizeUser(data.following, 'basic', requesterId);
//   }
  
//   if (data.pendingConnections) {
//     result.pendingConnections = sanitizeUser(data.pendingConnections, 'basic', requesterId);
//   }

//   return result;
// };