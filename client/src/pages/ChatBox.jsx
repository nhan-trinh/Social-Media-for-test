import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
// import typingSound from "../sounds/typing.mp3";
import {
  addMessage,
  fetchMessages,
  resetMessages,
} from "../features/messages/messagesSlice";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";
// import useSound from "../hooks/useSound";

const ChatBox = () => {
  const { messages } = useSelector((state) => state.messages);
  const { userId } = useParams();
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const { socket } = useSocket();

  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const connections = useSelector((state) => state.connections.connections);
  // const typingAudio = useRef(new Audio(typingSound));

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    try {
      if (!text && !image) return;
      setSubmitting(true);

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      image && formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessage(data.message));

        // Emit stop typing when message is sent
        if (socket && currentUser) {
          socket.emit("stopped-typing", {
            userId: userId,
            user: {
              id: currentUser.id,
              username: currentUser.username || currentUser.firstName,
            },
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle typing events
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socket && currentUser && e.target.value.trim()) {
      // Emit typing event
      socket.emit("typing", {
        userId: userId,
        user: {
          id: currentUser.id,
          username: currentUser.username || currentUser.firstName,
        },
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to emit stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopped-typing", {
          userId: userId,
          user: {
            id: currentUser.id,
            username: currentUser.username || currentUser.firstName,
          },
        });
      }, 2000);
    }
  };

  useEffect(() => {
    fetchUserMessages();

    return () => {
      dispatch(resetMessages());
    };
  }, [userId]);

  useEffect(() => {
    if (connections.length > 0) {
      const user = connections.find((connection) => connection._id === userId);
      setUser(user);
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event listeners for typing
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleTyping = (userData) => {
      if (userData.id !== currentUser.id) {
        setIsTyping(true);
        setTypingUser(userData.username);
        // typingAudio.current.currentTime = 0;
        // typingAudio.current.play().catch(() => {});
      }
    };

    const handleStoppedTyping = (userData) => {
      if (userData.id !== currentUser.id) {
        setIsTyping(false);
        setTypingUser("");
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopped-typing", handleStoppedTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopped-typing", handleStoppedTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, currentUser]);

  return (
    user && (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-2 pl-64 h-14 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
          <img
            src={user.profile_picture}
            alt=""
            className="size-8 rounded-full"
          />
          <div>
            <p className="font-medium">{user.full_name}</p>
            <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
          </div>
        </div>
        <div className="p-5 md:px-10 h-full overflow-y-auto">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.to_user_id !== user._id
                      ? "items-start"
                      : "items-end"
                  }`}
                >
                  <div
                    className={`p-2 text-sm max-w-sm bg-white text-slate-700 rounded-lg shadow ${
                      message.to_user_id !== user._id
                        ? "rounded-bl-none"
                        : "rounded-br-none"
                    }`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1"
                        alt=""
                      />
                    )}
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start">
                <div className="p-2 text-sm bg-gray-100 text-gray-600 rounded-lg rounded-bl-none shadow">
                  <div className="flex items-center gap-1">
                    {/* <span>{typingUser} is typing</span> */}
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="px-4">
          <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
            <input
              type="text"
              className="flex-1 outline-none text-slate-700"
              placeholder="Type a Message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={handleInputChange}
              value={text}
            />

            <label htmlFor="image">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt=""
                  className="h-8 rounded"
                />
              ) : (
                <ImageIcon className="size-7 text-gray-400 cursor-pointer" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files[0])}
              />
            </label>
            <button
              onClick={sendMessage}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              ) : (
                <SendHorizonal size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default ChatBox;
