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
  LogOut,
  Info,
  Settings,
  UserX,
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
  DropdownMenuSeparator,
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

    if (timestamp && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp) {
      date = new Date(timestamp);
    } else {
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

    if (timestamp && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp) {
      date = new Date(timestamp);
    } else {
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

  const parts = address.split(",");
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
  const [isLeaving, setIsLeaving] = React.useState(false);

  const currentUser = {
    uid: user?.uid || "anonymous",
    firstName: user?.displayName?.split(" ")[0] || "User",
    lastName: user?.displayName?.split(" ")[1] || "",
    email: user?.email || "user@example.com",
  };

  const handleChatSelect = (room: any) => {
    setSelectedChatRoom(room);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setShowChatList(true);

    if (window.innerWidth < 768) {
      setSelectedChatRoom(null);
    }
  };

  const filteredChatRooms = React.useMemo(() => {
    if (!searchQuery.trim()) return chatRooms;

    return chatRooms.filter(
      (room) =>
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.route?.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.route?.to?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chatRooms, searchQuery]);

  const handleDeleteChat = async (chatRoomId: string) => {
    if (!user || !chatRoomId) return;

    setIsDeleting(true);

    try {
      const isOrganizer = await chatService.isChatRoomOrganizer(
        chatRoomId,
        user.uid,
      );

      if (isOrganizer) {
        await chatService.permanentlyDeleteChat(chatRoomId);

        setChatRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== chatRoomId),
        );

        if (selectedChatRoom?.id === chatRoomId) {
          setSelectedChatRoom(null);
          setShowChatList(true);
        }

        toast.success("Chat room deleted permanently for all participants.");
      } else {
        await chatService.deleteChatForUser(chatRoomId, user.uid);

        setChatRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== chatRoomId),
        );

        if (selectedChatRoom?.id === chatRoomId) {
          setSelectedChatRoom(null);
          setShowChatList(true);
        }

        toast.success("Chat deleted from your view successfully");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeaveChat = async (chatRoomId: string) => {
    if (!user || !chatRoomId) return;

    setIsLeaving(true);

    try {
      const isOrganizer = await chatService.isChatRoomOrganizer(
        chatRoomId,
        user.uid,
      );

      if (isOrganizer) {
        await chatService.permanentlyDeleteChat(chatRoomId);

        setChatRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== chatRoomId),
        );

        if (selectedChatRoom?.id === chatRoomId) {
          setSelectedChatRoom(null);
          setShowChatList(true);
        }
        setMessages([]);

        toast.success(
          "Chat room deleted successfully. All participants have been notified.",
        );
      } else {
        await chatService.leaveChatRoom(chatRoomId, user.uid);

        setChatRooms((prevRooms) =>
          prevRooms.filter((room) => room.id !== chatRoomId),
        );

        if (selectedChatRoom?.id === chatRoomId) {
          setSelectedChatRoom(null);
          setShowChatList(true);
        }
        setMessages([]);

        toast.success("Successfully left the chat");
      }
    } catch (error) {
      console.error("Error leaving chat:", error);
      toast.error("Failed to leave chat. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleViewDetails = (rideId: string) => {
    router.push(`/ride/${rideId}`);
  };

  const isUserOrganizer = (chatRoom: any) => {
    return user?.uid && chatRoom?.createdBy === user.uid;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom) return;

    try {
      await chatService.sendMessage(
        selectedChatRoom.id,
        newMessage.trim(),
        user!,
      );
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

  React.useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = chatService.subscribeToUserChatRooms(
      user.uid,
      (rooms) => {
        setChatRooms(rooms);

        if (rooms.length > 0 && !selectedChatRoom && window.innerWidth >= 768) {
          setSelectedChatRoom(rooms[0]);
        }
      },
    );

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

  // MISSING: No chats empty state
  if (chatRooms.length === 0) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center ${nunito.className}`}
      >
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
  <div
    className={`h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex ${nunito.className}`}
  >
    {/* Background decorative elements */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />
    <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-green-500/5 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500/5 rounded-full blur-3xl" />

    {/* Chat List Sidebar */}
    <div
      className={`${
        showChatList ? "flex" : "hidden"
      } md:flex md:w-80 lg:w-96 w-full relative z-10 bg-gray-900/50 backdrop-blur-xl border-r border-green-800/30 flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-green-800/30 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 flex-shrink-0"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
              Raahi Chat
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">
              Your ride conversations
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-green-800/30">
        <div className="relative group">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 py-2 text-sm bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300"
          />
        </div>
      </div>

      {/* Enhanced Chat Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChatRooms.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-gray-400 text-sm">
            {searchQuery
              ? "No conversations match your search"
              : "No chat rooms yet. Book a ride to start chatting!"}
          </div>
        ) : (
          filteredChatRooms.map((room: any) => (
            <div
              key={room.id}
              className={`group relative p-2 sm:p-3 md:p-4 border-b border-gray-700/30 hover:bg-gray-800/30 cursor-pointer transition-all duration-300 active:bg-gray-800/40 ${
                selectedChatRoom?.id === room.id
                  ? "bg-gray-800/50 border-green-500/30"
                  : ""
              }`}
              onClick={() => handleChatSelect(room)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ring-2 ring-green-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xs sm:text-sm">
                      {formatAddress(room.route?.from || "R", 1)
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[60px] sm:max-w-[80px] md:max-w-none">
                        {formatAddress(room.route?.from || "Unknown", 10)}
                      </span>
                      <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[60px] sm:max-w-[80px] md:max-w-none">
                        {formatAddress(room.route?.to || "Unknown", 10)}
                      </span>

                      {isUserOrganizer(room) && (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs px-1 py-0">
                          Host
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
                      {room.lastMessage &&
                        formatLastMessageTime(room.lastMessage.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs sm:text-sm text-gray-400 truncate flex-1 min-w-0 pr-1">
                      {room.lastMessage
                        ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                        : "No messages yet"}
                    </p>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs flex-shrink-0 px-1 py-0">
                      <Users className="h-2.5 w-2.5 mr-0.5" />
                      {room.participants?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {room.route?.date || "Unknown"} • {room.route?.time || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Menu for Desktop */}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      className="text-gray-300 focus:text-white focus:bg-gray-700 cursor-pointer text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(room.rideId || room.id);
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-gray-700" />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700 mx-2 max-w-[calc(100vw-16px)] sm:mx-4 sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white text-sm sm:text-base">
                            Leave Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
                            Are you sure you want to leave this chat? You will:
                            <ul className="mt-2 list-disc list-inside text-xs">
                              <li>No longer receive messages from this group</li>
                              <li>Need to be re-added by the organizer to rejoin</li>
                              <li>Your booking will be marked as 'left'</li>
                              <li>A seat will become available for other users</li>
                            </ul>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 text-sm">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleLeaveChat(room.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-sm"
                            disabled={isLeaving}
                          >
                            {isLeaving ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                Leaving...
                              </>
                            ) : (
                              "Leave Chat"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700 mx-2 max-w-[calc(100vw-16px)] sm:mx-4 sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white text-sm sm:text-base">
                            Delete Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
                            Are you sure you want to delete this chat? This will remove it from your view but other participants can still see it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 text-sm">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChat(room.id)}
                            className="bg-red-600 hover:bg-red-700 text-sm"
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
          ))
        )}
      </div>
    </div>

    {/* Chat Area */}
    <div
      className={`${!showChatList ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 relative z-10`}
    >
      {selectedChatRoom ? (
        <>
          {/* Enhanced Chat Header */}
          <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 md:hidden text-gray-400 hover:text-white flex-shrink-0"
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 ring-2 ring-green-500/30 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xs sm:text-sm">
                  {formatAddress(selectedChatRoom.route?.from || "R", 1)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                {/* Mobile display */}
                <div className="md:hidden">
                  <div className="flex items-center space-x-1 text-white">
                    <span className="font-semibold text-xs truncate max-w-[50px] sm:max-w-[70px]">
                      {formatAddress(selectedChatRoom.route?.from || "Unknown", 8)}
                    </span>
                    <ChevronRight className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-xs truncate max-w-[50px] sm:max-w-[70px]">
                      {formatAddress(selectedChatRoom.route?.to || "Unknown", 8)}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Users className="h-2.5 w-2.5 mr-1" />
                    <span>{selectedChatRoom.participants?.length || 0} members</span>
                    {isUserOrganizer(selectedChatRoom) && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-orange-400">Host</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop display */}
                <div className="hidden md:block">
                  <div className="flex items-center space-x-2 text-white">
                    <span className="font-semibold text-sm lg:text-base truncate">
                      {formatAddress(selectedChatRoom.route?.from || "Unknown", 20)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-sm lg:text-base truncate">
                      {formatAddress(selectedChatRoom.route?.to || "Unknown", 20)}
                    </span>
                    {isUserOrganizer(selectedChatRoom) && (
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 flex-shrink-0">
                        Host
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-xs lg:text-sm text-gray-400">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{selectedChatRoom.participants?.length || 0} members</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="truncate">
                      {selectedChatRoom.route?.date || "Unknown"} at{" "}
                      {selectedChatRoom.route?.time || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Details Button - Desktop */}
              <Button
                onClick={() =>
                  handleViewDetails(selectedChatRoom.rideId || selectedChatRoom.id)
                }
                variant="outline"
                size="sm"
                className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hidden md:flex text-xs lg:text-sm px-2 py-1"
              >
                <Info className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                Details
              </Button>

              {/* Mobile menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      className="text-gray-300 focus:text-white focus:bg-gray-700 cursor-pointer text-sm"
                      onClick={() =>
                        handleViewDetails(selectedChatRoom.rideId || selectedChatRoom.id)
                      }
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-gray-700" />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700 mx-2 max-w-[calc(100vw-16px)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white text-sm">
                            Leave Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400 text-xs">
                            Are you sure you want to leave this chat?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col gap-2">
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 text-sm w-full">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleLeaveChat(selectedChatRoom.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-sm w-full"
                            disabled={isLeaving}
                          >
                            {isLeaving ? "Leaving..." : "Leave"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700 mx-2 max-w-[calc(100vw-16px)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white text-sm">
                            Delete Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400 text-xs">
                            Are you sure you want to delete this chat?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col gap-2">
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 text-sm w-full">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChat(selectedChatRoom.id)}
                            className="bg-red-600 hover:bg-red-700 text-sm w-full"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop menu */}
              <div className="hidden md:flex items-center space-x-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs px-2 py-1">
                  <Shield className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-1" />
                  Active
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 lg:h-8 lg:w-8 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-orange-400 focus:text-orange-300 focus:bg-orange-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Leave Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Leave Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to leave this chat? You won't be able to see new messages or rejoin unless someone adds you back.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleLeaveChat(selectedChatRoom.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={isLeaving}
                          >
                            {isLeaving ? "Leaving..." : "Leave Chat"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer text-sm"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Delete Chat
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Are you sure you want to delete this chat? This will remove it from your view but other participants can still see it.
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 bg-gray-900/20">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-4 sm:py-8">
                <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-600" />
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">
                  No messages yet
                </h3>
                <p className="text-xs sm:text-base">Start the conversation with your fellow travelers!</p>
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
                      className={`max-w-[90%] sm:max-w-[85%] md:max-w-md rounded-2xl p-2 sm:p-3 md:p-4 shadow-lg ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                          : "bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 text-white"
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="text-xs font-medium text-green-400 mb-1 sm:mb-2">
                          {message.senderName}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed break-words">
                        {message.text}
                      </p>
                      <div
                        className={`flex items-center justify-end mt-1 sm:mt-2 space-x-1 text-xs ${
                          isOwnMessage ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {isOwnMessage && <CheckCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Message Input */}
          <div className="p-2 sm:p-3 md:p-4 border-t border-green-800/30 bg-gray-900/50 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl py-2 sm:py-3 px-3 sm:px-4 pr-10 sm:pr-12 transition-all duration-300 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 text-gray-400 hover:text-green-400"
                >
                  <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="h-9 w-9 sm:h-11 sm:w-11 md:h-12 md:w-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-900/20 p-4">
          <div className="text-center">
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
              <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">
              Select a conversation
            </h3>
            <p className="text-gray-400 max-w-md text-sm sm:text-base">
              Choose a chat room to start messaging with your fellow travelers
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);
}