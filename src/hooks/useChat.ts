"use client";

import { useState, useEffect, useCallback } from "react";
import { chatService, ChatMessage, ChatRoom } from "@/lib/chatService";
import { useAuth } from "@/context/AuthContext";

export function useChat(chatRoomId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to messages for a specific chat room
  useEffect(() => {
    if (!chatRoomId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToMessages(
      chatRoomId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [chatRoomId]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !chatRoomId || !text.trim()) return;

      try {
        setError(null);
        await chatService.sendMessage(chatRoomId, text.trim(), user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      }
    },
    [user, chatRoomId],
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}

export function useChatRooms() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to user's chat rooms
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const unsubscribe = chatService.subscribeToUserChatRooms(
      user.uid,
      (newChatRooms) => {
        setChatRooms(newChatRooms);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  return {
    chatRooms,
    loading,
    error,
  };
}
