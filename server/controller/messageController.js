import fs from 'fs'
import imagekit from '../configs/imagekit.js';
import Message from '../models/Message.js';

const connections = {};

export const sseController = (req, res) => {
    const {userId} = req.params
    console.log('New client connected:', userId)

    // Set CORS headers trước
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Disable buffering
    res.flushHeaders();
    
    connections[userId] = res;

    // Send initial connection message
    res.write('data: {"type": "connection", "message": "Connected to SSE stream"}\n\n');

    // Handle client disconnect
    req.on('close', () => {
        delete connections[userId];
        console.log('Client disconnected:', userId);
    });

    req.on('aborted', () => {
        delete connections[userId];
        console.log('Client aborted connection:', userId);
    });
}

export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth()
        const {to_user_id, text} = req.body;
        const image = req.file;
        let media_url = ''
        let message_type = image ? 'image' : 'text';

        if(message_type === 'image'){
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file:fileBuffer,
                fileName: image.originalname,
            })

            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'auto'},
                    {width: '1280'}
                ]
            })
        }
        
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        // Populate message với thông tin user
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

        res.json({success: true, message: messageWithUserData})

        // Gửi tin nhắn qua SSE cho người nhận
        if (connections[to_user_id]) {
            const sseData = {
                type: 'new_message',
                data: messageWithUserData
            };
            
            try {
                connections[to_user_id].write(`data: ${JSON.stringify(sseData)}\n\n`);
                console.log('Message sent via SSE to:', to_user_id);
            } catch (sseError) {
                console.log('SSE send error:', sseError);
                delete connections[to_user_id]; // Remove broken connection
            }
        } else {
            console.log('No SSE connection found for user:', to_user_id);
        }

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

export const getChatMessages = async (req, res) => {
    try {
        const {userId} = req.auth()
        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId}
            ]
        }).sort({createdAt: 1})

        await Message.updateMany({from_user_id: to_user_id, to_user_id: userId}, {seen: true})

        res.json({success: true, messages})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const getUserRececentMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const messages = await Message.find({to_user_id: userId}).populate('from_user_id to_user_id').sort({createdAt: -1})

        res.json({success: true, messages})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}