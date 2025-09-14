import React from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { X, MessageCircle, Camera } from 'lucide-react'

const Notifications = ({ t, message }) => {
    const navigate = useNavigate()

    const handleReply = () => {
        navigate(`/messages/${message.from_user_id._id}`)
        toast.dismiss(t.id)
    }

    const handleDismiss = () => {
        toast.dismiss(t.id)
    }

    return (
        <div className={`max-w-sm w-full transform transition-all duration-300 ease-out ${
            t.visible 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-full opacity-0 scale-95'
        }`}>
            <div className="bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-sm 
                          border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1">
                    <div className="bg-white/95 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <img 
                                        src={message.from_user_id.profile_picture} 
                                        alt={message.from_user_id.full_name} 
                                        className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-100"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {message.from_user_id.full_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        @{message.from_user_id.username || 'user'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleDismiss}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                                         rounded-full transition-all duration-200 hover:scale-110"
                                aria-label="Dismiss notification"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        
                        {/* Message Content */}
                        <div className="mt-3 space-y-3">
                            <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    {message.message_type === 'image' ? (
                                        <Camera className="w-4 h-4 text-indigo-500" />
                                    ) : (
                                        <MessageCircle className="w-4 h-4 text-indigo-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    {message.message_type === 'image' ? (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600 font-medium">Sent you a photo</p>
                                            {message.media_url && (
                                                <img 
                                                    src={message.media_url}
                                                    alt="Shared image"
                                                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                                />
                                            )}
                                            {message.text && (
                                                <p className="text-sm text-gray-600">
                                                    {message.text.slice(0, 60)}{message.text.length > 60 ? '...' : ''}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            "{message.text?.slice(0, 80)}{message.text?.length > 80 ? '...' : ''}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <button 
                                onClick={handleReply}
                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 
                                         hover:from-indigo-600 hover:to-purple-700 
                                         text-white font-semibold py-2.5 px-4 rounded-xl
                                         transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg
                                         flex items-center justify-center space-x-2"
                            >
                                <MessageCircle size={16} />
                                <span>Reply</span>
                            </button>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="mt-3 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Decorative bottom border */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            </div>
        </div>
    )
}

export default Notifications