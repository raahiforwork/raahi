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
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChat, useChatRooms } from "@/hooks/useChat";
import { ChatRoom, ChatMessage } from "@/lib/chatService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FirebaseChatApp() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedChatRoom, setSelectedChatRoom] = React.useState<any>(null);
  const [newMessage, setNewMessage] = React.useState("");
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [chatRooms, setChatRooms] = React.useState<any[]>([]);
  const [messages, setMessages] = React.useState<any[]>([]);

  // Get current user info
  const currentUser = {
    uid: user?.uid || "anonymous",
    firstName: user?.displayName?.split(" ")[0] || "User",
    lastName: user?.displayName?.split(" ")[1] || "",
    email: user?.email || "user@example.com",
  };

  // Load chat rooms from localStorage
  React.useEffect(() => {
    const savedRooms = localStorage.getItem("chatRooms");
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms);
      setChatRooms(rooms);
      if (rooms.length > 0 && !selectedChatRoom) {
        setSelectedChatRoom(rooms[0]);
      }
    }
  }, [selectedChatRoom]);

  // Load messages for selected room
  React.useEffect(() => {
    if (selectedChatRoom) {
      const savedMessages = localStorage.getItem(
        `messages_${selectedChatRoom.id}`,
      );
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    }
  }, [selectedChatRoom]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom) return;

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      senderId: currentUser.uid,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderEmail: currentUser.email,
      timestamp: new Date(),
      chatRoomId: selectedChatRoom.id,
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(
      `messages_${selectedChatRoom.id}`,
      JSON.stringify(updatedMessages),
    );
    setNewMessage("");
    toast.success("Message sent!");
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  // Format last message time
  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
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
    } catch {
      return "";
    }
  };

  // Authentication is now handled by ProtectedRoute wrapper

  // Show empty state if no chat rooms
  if (chatRooms.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No Chats Yet</CardTitle>
            <CardDescription>
              Book a ride to start chatting with other passengers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Find Rides
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Chat Rooms List */}
      <div
        className={`${
          isMobileView ? "hidden" : "flex"
        } md:flex md:w-80 lg:w-96 border-r border-border bg-card flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg md:text-xl font-bold gradient-text">
                Raahi Chat
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Your ride conversations
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 md:p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No chat rooms yet. Book a ride to start chatting!
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setSelectedChatRoom(room);
                  setIsMobileView(true);
                }}
                className={`p-3 md:p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
                  selectedChatRoom?.id === room.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarFallback className="bg-carpool-600 text-white text-sm font-medium">
                        {room.name.split("→")[0].trim().charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {room.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {room.lastMessage &&
                          formatLastMessageTime(room.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[180px]">
                        {room.lastMessage
                          ? `${room.lastMessage.senderName}: ${room.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {room.participants.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Route info */}
                    <div className="flex items-center mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {room.route.date} • {room.route.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Back Button - Only visible on mobile when chat is selected */}
        <div
          className={`${
            isMobileView ? "flex" : "hidden"
          } md:hidden items-center p-3 border-b border-border bg-card`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-3"
            onClick={() => setIsMobileView(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {selectedChatRoom && (
            <div className="flex-1">
              <h2 className="font-semibold">{selectedChatRoom.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedChatRoom.participants.length} members
              </p>
            </div>
          )}
        </div>

        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="hidden md:flex items-center justify-between p-4 border-b border-border bg-card">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-carpool-600 text-white">
                    {selectedChatRoom.name.split("→")[0].trim().charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedChatRoom.name}</h2>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3 w-3 mr-1" />
                    <span>{selectedChatRoom.participants.length} members</span>
                    <span className="mx-2">•</span>
                    <span>
                      {selectedChatRoom.route.date} at{" "}
                      {selectedChatRoom.route.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Route Information Card */}
            <div className="p-4 bg-card border-b border-border">
              <Card className="bg-gradient-to-r from-carpool-50 to-carpool-100 dark:from-carpool-950 dark:to-carpool-900 border-carpool-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-carpool-600 rounded-full"></div>
                        <span className="font-medium text-sm">
                          {selectedChatRoom.route.from}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-carpool-300"></div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {selectedChatRoom.route.to}
                        </span>
                        <div className="w-3 h-3 bg-carpool-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {selectedChatRoom.route.date} •{" "}
                          {selectedChatRoom.route.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No messages yet. Start the conversation!
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
                        className={`max-w-[85%] md:max-w-md rounded-lg p-3 ${
                          isOwnMessage
                            ? "bg-carpool-600 text-white"
                            : "bg-card border border-border"
                        }`}
                      >
                        {!isOwnMessage && (
                          <div className="text-xs font-medium text-carpool-600 dark:text-carpool-400 mb-1">
                            {message.senderName}
                          </div>
                        )}
                        <p className="text-sm md:text-base">{message.text}</p>
                        <div
                          className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                            isOwnMessage
                              ? "text-carpool-100"
                              : "text-muted-foreground"
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

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-8 w-8 bg-carpool-600 hover:bg-carpool-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Choose a chat room to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
