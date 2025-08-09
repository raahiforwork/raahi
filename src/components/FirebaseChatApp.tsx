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
  ChevronRight,
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

const formatMessageTime = (timestamp: any) => {
  if (!timestamp) return "";
  
  try {
    let date;
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    
    else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
    else if (timestamp) {
      date = new Date(timestamp);
    }
    else {
      return "";
    }

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
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    }
    else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    }
  
    else if (timestamp) {
      date = new Date(timestamp);
    }
    else {
      return "";
    }


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

const formatAddress = (address: string, maxLength: number = 20) => {
  if (!address) return "";
  if (address.length <= maxLength) return address;
  

  const parts = address.split(',');
  if (parts.length > 1) {
    
    const firstPart = parts[0].trim();
    if (firstPart.length <= maxLength) {
      return firstPart;
    }
  }
  
  return address.substring(0, maxLength) + "...";
};

export default function ModernChatApp() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedChatRoom, setSelectedChatRoom] = React.useState<any>(null);
  const [newMessage, setNewMessage] = React.useState("");
  const [showChatList, setShowChatList] = React.useState(true);
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

  const handleDeleteChat = async (chatRoomId: string) => {
    if (!user || !chatRoomId) return;

    setIsDeleting(true);
    
    try {
      await chatService.deleteChatForUser(chatRoomId, user.uid);
      
      
      setChatRooms(prevRooms => 
        prevRooms.filter(room => room.id !== chatRoomId)
      );
      
     
      if (selectedChatRoom?.id === chatRoomId) {
        setSelectedChatRoom(null);
        setShowChatList(true);
      }

      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

 
  const handleChatSelect = (room: any) => {
    setSelectedChatRoom(room);
    setShowChatList(false); 
  };

 
  const handleBackToList = () => {
    setShowChatList(true);
 
  };

  React.useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = chatService.subscribeToUserChatRooms(user.uid, (rooms) => {
      setChatRooms(rooms);
    
      if (rooms.length > 0 && !selectedChatRoom && window.innerWidth >= 768) {
        setSelectedChatRoom(rooms[0]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

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

      
      <div className={`${showChatList ? "flex" : "hidden"} md:flex md:w-80 lg:w-96 w-full relative z-10 bg-gray-900/50 backdrop-blur-xl border-r border-green-800/30 flex-col`}>
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
                className={`group relative p-4 border-b border-gray-700/30 hover:bg-gray-800/30 cursor-pointer transition-all duration-300 active:bg-gray-800/40 ${
                  selectedChatRoom?.id === room.id ? "bg-gray-800/50 border-green-500/30" : ""
                }`}
                onClick={() => handleChatSelect(room)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-green-500/30">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                        {formatAddress(room.route.from, 1).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <span className="font-semibold text-white text-sm">
                          {formatAddress(room.route.from, 15)}
                        </span>
                        <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-white text-sm truncate">
                          {formatAddress(room.route.to, 15)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {room.lastMessage && formatLastMessageTime(room.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate flex-1 min-w-0 pr-2">
                        {room.lastMessage
                          ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs flex-shrink-0">
                        <Users className="h-3 w-3 mr-1" />
                        {room.participants.length}
                      </Badge>
                    </div>

                    {/* Route info - Mobile optimized */}
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {room.route.date} • {room.route.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete Button - Hidden on mobile in list view */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                        disabled={isDeleting}
                        onClick={(e) => e.stopPropagation()}
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

      
      <div className={`${!showChatList ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 relative z-10`}>
        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden text-gray-400 hover:text-white"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-green-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                    {formatAddress(selectedChatRoom.route.from, 1).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  {/* Mobile: Compact address display */}
                  <div className="md:hidden">
                    <div className="flex items-center space-x-1 text-white">
                      <span className="font-semibold text-sm truncate max-w-[80px]">
                        {formatAddress(selectedChatRoom.route.from, 12)}
                      </span>
                      <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-sm truncate max-w-[80px]">
                        {formatAddress(selectedChatRoom.route.to, 12)}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{selectedChatRoom.participants.length} members</span>
                    </div>
                  </div>
                  
                  {/* Desktop: Full display */}
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-2 text-white">
                      <span className="font-semibold">
                        {formatAddress(selectedChatRoom.route.from, 25)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">
                        {formatAddress(selectedChatRoom.route.to, 25)}
                      </span>
                    </div>
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
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Mobile: Simplified actions */}
                <div className="md:hidden">
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
                        <AlertDialogContent className="bg-gray-900 border-gray-700 mx-4">
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Desktop: Full actions */}
                <div className="hidden md:flex items-center space-x-2">
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Active Ride
                  </Badge>
                  
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
            </div>

            {/* Enhanced Route Information Card - Hidden on mobile */}
            <div className="hidden md:block p-4 bg-gray-900/30 border-b border-green-800/30">
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl border border-green-800/20 p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium text-white">
                        {formatAddress(selectedChatRoom.route.from, 30)}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center space-x-2">
                      <div className="h-px bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 flex-1"></div>
                      <Car className="h-4 w-4 text-blue-400" />
                      <div className="h-px bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 flex-1"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">
                        {formatAddress(selectedChatRoom.route.to, 30)}
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
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-900/20">
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
                        className={`max-w-[85%] md:max-w-md rounded-2xl p-3 md:p-4 shadow-lg ${
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
            <div className="p-3 md:p-4 border-t border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
              <div className="flex items-center space-x-2 md:space-x-3">
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
                  className="h-11 w-11 md:h-12 md:w-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900/20">
            <div className="text-center p-4">
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
