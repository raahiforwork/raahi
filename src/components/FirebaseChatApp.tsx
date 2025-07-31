"use client";

import * as React from "react";
import {
  ArrowLeft,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  MapPin,
  Clock,
  Users,
  Star,
  Paperclip,
  Smile,
  CheckCheck,
  Check,
  Car,
  Calendar,
  Navigation,
  MessageCircle,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { chatService } from "@/lib/chatService";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ChatRoom, ChatMessage } from "@/lib/chatService";
import { format } from "date-fns";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "700"] });

// Enhanced timestamp formatting functions
const formatMessageTime = (timestamp: any) => {
  if (!timestamp) return "";
  
  try {
    let date;
    
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore timestamp object with seconds and nanoseconds
    else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // Handle regular Date object or date string
    else if (timestamp) {
      date = new Date(timestamp);
    }
    else {
      return "";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting message time:", error);
    return "";
  }
};

const formatLastMessageTime = (timestamp: any) => {
  if (!timestamp) return "";

  try {
    let date;
    
    // Handle Firestore Timestamp
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    // Handle Firestore timestamp object with seconds and nanoseconds
    else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    // Handle regular Date object or date string
    else if (timestamp) {
      date = new Date(timestamp);
    }
    else {
      return "";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  } catch (error) {
    console.error("Error formatting last message time:", error);
    return "";
  }
};

export default function ModernChatApp() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedChatRoom, setSelectedChatRoom] = React.useState<any>(null);
  const [newMessage, setNewMessage] = React.useState("");
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [chatRooms, setChatRooms] = React.useState<any[]>([]);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const currentUser = {
    uid: user?.uid || "anonymous",
    firstName: user?.displayName?.split(" ")[0] || "User",
    lastName: user?.displayName?.split(" ")[1] || "",
    email: user?.email || "user@example.com",
  };

  // Enhanced delete chat function using chatService
  const handleDeleteChat = async (chatRoomId: string) => {
    if (!user || !chatRoomId) return;

    setIsDeleting(true);
    
    try {
      await chatService.deleteChatForUser(chatRoomId, user.uid);
      
      // Update local state
      setChatRooms(prevRooms => 
        prevRooms.filter(room => room.id !== chatRoomId)
      );
      
      // If this was the selected chat, clear selection
      if (selectedChatRoom?.id === chatRoomId) {
        setSelectedChatRoom(null);
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

  React.useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = chatService.subscribeToUserChatRooms(user.uid, (rooms) => {
      setChatRooms(rooms);
      if (rooms.length > 0 && !selectedChatRoom) {
        setSelectedChatRoom(rooms[0]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, selectedChatRoom]);

  React.useEffect(() => {
    if (!selectedChatRoom) return;

    const unsubscribe = chatService.subscribeToMessages(
      selectedChatRoom.id,
      (msgs) => {
        setMessages(msgs);
      },
    );

    return () => unsubscribe();
  }, [selectedChatRoom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom) return;

    try {
      await chatService.sendMessage(selectedChatRoom.id, newMessage.trim(), user!);
      setNewMessage("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter chat rooms based on search query
  const filteredChatRooms = React.useMemo(() => {
    if (!searchQuery.trim()) return chatRooms;
    
    return chatRooms.filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.route.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.route.to.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatRooms, searchQuery]);

  if (chatRooms.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center ${nunito.className}`}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-green-800/30 p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-fit mx-auto mb-6 shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Chats Yet</h3>
            <p className="text-gray-400 mb-6">
              Book a ride to start chatting with other passengers and drivers
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300"
            >
              <Car className="h-5 w-5 mr-2" />
              Find Rides
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex ${nunito.className}`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Sidebar - Chat Rooms List */}
      <div className={`${isMobileView ? "hidden" : "flex"} md:flex md:w-80 lg:w-96 relative z-10 bg-gray-900/50 backdrop-blur-xl border-r border-green-800/30 flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-800/30 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Raahi Chat
              </h1>
              <p className="text-sm text-gray-400">
                Your ride conversations
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-green-800/30">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
            />
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {searchQuery ? "No conversations match your search" : "No chat rooms yet. Book a ride to start chatting!"}
            </div>
          ) : (
            filteredChatRooms.map((room) => (
              <div
                key={room.id}
                className={`group relative p-4 border-b border-gray-700/30 hover:bg-gray-800/30 cursor-pointer transition-all duration-300 ${
                  selectedChatRoom?.id === room.id ? "bg-gray-800/50 border-green-500/30" : ""
                }`}
              >
                <div 
                  className="flex items-center space-x-3"
                  onClick={() => {
                    setSelectedChatRoom(room);
                    setIsMobileView(true);
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-green-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                        {room.name.split("→")[0].trim().charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">
                        {room.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {room.lastMessage && formatLastMessageTime(room.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate max-w-[180px]">
                        {room.lastMessage
                          ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {room.participants.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Route info */}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {room.route.date} • {room.route.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Delete Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Are you sure you want to delete this chat? This action cannot be undone. 
                          The chat will be removed from your view, but other participants can still see it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteChat(room.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete Chat"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header */}
        <div className={`${isMobileView ? "flex" : "hidden"} md:hidden items-center p-3 border-b border-green-800/30 bg-gray-900/50 backdrop-blur-xl`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-3 text-gray-400 hover:text-white"
            onClick={() => setIsMobileView(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {selectedChatRoom && (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">{selectedChatRoom.name}</h2>
                <p className="text-sm text-gray-400">
                  {selectedChatRoom.participants.length} members
                </p>
              </div>
              
              {/* Mobile Delete Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-900 border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Chat</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Are you sure you want to delete this chat? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteChat(selectedChatRoom.id)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Chat"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {selectedChatRoom ? (
          <>
            {/* Enhanced Chat Header with Delete Button */}
            <div className="hidden md:flex items-center justify-between p-4 border-b border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 ring-2 ring-green-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                    {selectedChatRoom.name.split("→")[0].trim().charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-white text-lg">{selectedChatRoom.name}</h2>
                  <div className="flex items-center text-sm text-gray-400">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{selectedChatRoom.participants.length} members</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {selectedChatRoom.route.date} at {selectedChatRoom.route.time}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Shield className="h-3 w-3 mr-1" />
                  Active Ride
                </Badge>
                
                {/* Desktop Delete Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Chat</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete this chat? This action cannot be undone. 
                            The chat will be removed from your view, but other participants can still see it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteChat(selectedChatRoom.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete Chat"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Enhanced Route Information Card */}
            <div className="p-4 bg-gray-900/30 border-b border-green-800/30">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium text-white">
                        {selectedChatRoom.route.from}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center space-x-2">
                      <div className="h-px bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 flex-1"></div>
                      <Car className="h-4 w-4 text-blue-400" />
                      <div className="h-px bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 flex-1"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">
                        {selectedChatRoom.route.to}
                      </span>
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 ml-6">
                    <div className="flex items-center space-x-1 bg-gray-800/30 px-3 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span>
                        {selectedChatRoom.route.date} • {selectedChatRoom.route.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/20">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p>Start the conversation with your fellow travelers!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUser.uid;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-md rounded-2xl p-4 shadow-lg ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                            : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-white"
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="text-xs font-medium text-green-400 mb-2">
                            {message.senderName}
                          </div>
                        )}
                        <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                        <div
                          className={`flex items-center justify-end mt-2 space-x-1 text-xs ${
                            isOwnMessage
                              ? "text-green-100"
                              : "text-gray-400"
                          }`}
                        >
                          <span>{formatMessageTime(message.timestamp)}</span>
                          {isOwnMessage && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Enhanced Message Input */}
            <div className="p-4 border-t border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl py-3 px-4 pr-12 transition-all duration-300"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-green-400"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="h-12 w-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900/20">
            <div className="text-center">
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl w-fit mx-auto mb-6">
                <MessageCircle className="h-16 w-16 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Select a conversation
              </h3>
              <p className="text-gray-400 max-w-md">
                Choose a chat room to start messaging with your fellow travelers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
