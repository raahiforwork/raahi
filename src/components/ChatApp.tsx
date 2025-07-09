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
import { useNavigateWithLoading } from "@/hooks/useNavigateWithLoading";

// Mock data for conversations
const conversations = [
  {
    id: 1,
    name: "Priya Sharma",
    avatar: "/placeholder.svg",
    lastMessage: "Great! See you at 8:30 AM tomorrow",
    time: "2m ago",
    unread: 0,
    online: true,
    route: "Connaught Place → Gurgaon",
    rating: 4.8,
    ridesShared: 45,
  },
  {
    id: 2,
    name: "Rohit Kumar",
    avatar: "/placeholder.svg",
    lastMessage: "Can we leave 15 minutes earlier?",
    time: "15m ago",
    unread: 2,
    online: false,
    route: "Lajpat Nagar → Noida",
    rating: 4.9,
    ridesShared: 32,
  },
  {
    id: 3,
    name: "Aarti Singh",
    avatar: "/placeholder.svg",
    lastMessage: "Thanks for the ride! 😊",
    time: "1h ago",
    unread: 0,
    online: true,
    route: "Karol Bagh → Dwarka",
    rating: 4.7,
    ridesShared: 28,
  },
  {
    id: 4,
    name: "Vikash Gupta",
    avatar: "/placeholder.svg",
    lastMessage: "I'll be there in 5 minutes",
    time: "2h ago",
    unread: 1,
    online: false,
    route: "Rajouri Garden → Cyber City",
    rating: 4.6,
    ridesShared: 67,
  },
];

// Mock messages for active chat
const messages = [
  {
    id: 1,
    sender: "Priya Sharma",
    content: "Hi! I saw your ride request from CP to Gurgaon",
    time: "10:30 AM",
    isOwn: false,
    status: "read",
  },
  {
    id: 2,
    sender: "You",
    content: "Hello! Yes, I need a ride for tomorrow morning",
    time: "10:32 AM",
    isOwn: true,
    status: "read",
  },
  {
    id: 3,
    sender: "Priya Sharma",
    content: "Perfect! I leave at 8:30 AM sharp. Is that okay for you?",
    time: "10:33 AM",
    isOwn: false,
    status: "read",
  },
  {
    id: 4,
    sender: "You",
    content: "That works perfectly! What's the pickup point?",
    time: "10:35 AM",
    isOwn: true,
    status: "read",
  },
  {
    id: 5,
    sender: "Priya Sharma",
    content:
      "I can pick you up from Metro Station Gate 2. The ride will cost ₹120 per person.",
    time: "10:36 AM",
    isOwn: false,
    status: "read",
  },
  {
    id: 6,
    sender: "You",
    content: "Sounds good! I'll be there at 8:25 AM",
    time: "10:38 AM",
    isOwn: true,
    status: "delivered",
  },
  {
    id: 7,
    sender: "Priya Sharma",
    content: "Great! See you at 8:30 AM tomorrow",
    time: "10:40 AM",
    isOwn: false,
    status: "read",
  },
];

export default function ChatApp() {
  const [selectedChat, setSelectedChat] = React.useState(conversations[0]);
  const { navigate } = useNavigateWithLoading();
  const [messageInput, setMessageInput] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      conv.route.toLowerCase().includes(searchInput.toLowerCase()),
  );

  const sendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Conversations List */}
      <div className="hidden md:flex md:w-80 lg:w-96 border-r border-border bg-card flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg md:text-xl font-bold gradient-text">
                Raahi Chat
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Find your ride partners
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation)}
              className={`p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedChat.id === conversation.id ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-start space-x-2 md:space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.avatar}
                      alt={conversation.name}
                    />
                    <AvatarFallback>
                      {conversation.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-carpool-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">
                      {conversation.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {conversation.time}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="h-3 w-3 text-carpool-600" />
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.route}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge className="bg-carpool-600 text-white text-xs">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Back Button - Only visible on mobile */}
        <div className="md:hidden flex items-center p-3 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-3"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold gradient-text">Messages</h1>
        </div>

        {/* Chat Header */}
        <div className="p-3 md:p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarImage
                    src={selectedChat.avatar}
                    alt={selectedChat.name}
                  />
                  <AvatarFallback>
                    {selectedChat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {selectedChat.online && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-carpool-500 border-2 border-background rounded-full"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm md:text-base truncate">
                  {selectedChat.name}
                </h2>
                <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{selectedChat.rating}</span>
                  <span>•</span>
                  <span>{selectedChat.ridesShared} rides</span>
                  <span>•</span>
                  <span
                    className={
                      selectedChat.online
                        ? "text-carpool-600"
                        : "text-muted-foreground"
                    }
                  >
                    {selectedChat.online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="md:hidden text-xs text-muted-foreground">
                  <span
                    className={
                      selectedChat.online
                        ? "text-carpool-600"
                        : "text-muted-foreground"
                    }
                  >
                    {selectedChat.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Phone className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Video className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Route Info Card */}
        <div className="p-3 md:p-4 bg-muted/30">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                  <MapPin className="h-4 w-4 text-carpool-600 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base truncate">
                    {selectedChat.route}
                  </span>
                </div>
                <div className="flex items-center justify-between md:justify-end space-x-2 md:space-x-4 text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>8:30 AM</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>2/4</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    ₹120
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg ${
                  message.isOwn
                    ? "bg-carpool-600 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs ${message.isOwn ? "text-carpool-100" : "text-muted-foreground"}`}
                  >
                    {message.time}
                  </span>
                  {message.isOwn && (
                    <div className="ml-2">
                      {message.status === "read" ? (
                        <CheckCheck className="h-3 w-3 text-carpool-100" />
                      ) : (
                        <Check className="h-3 w-3 text-carpool-200" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-3 md:p-4 border-t border-border bg-card">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 md:h-10 md:w-10"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="pr-10 text-sm md:text-base"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 md:h-8 md:w-8"
              >
                <Smile className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              size="icon"
              className="bg-carpool-600 hover:bg-carpool-700 h-8 w-8 md:h-10 md:w-10"
            >
              <Send className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mt-2">
            <p className="text-xs text-muted-foreground">
              🔒 Messages are encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
