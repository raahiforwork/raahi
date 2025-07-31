import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  getDocs,
  arrayUnion,
  getDoc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  timestamp: Timestamp | null;
  chatRoomId: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  rideId: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  createdAt: Timestamp | null;
  lastMessage?: {
    text: string;
    senderName: string;
    timestamp: Timestamp | null;
  };
  route: {
    from: string;
    to: string;
    date: string;
    time: string;
  };
  deletedFor?: string[]; // Add this line
}

export interface RideBooking {
  rideId: string;
  userId: string;
  userDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  route: {
    from: string;
    to: string;
    date: string;
    time: string;
  };
  driverDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

class ChatService {
  // Create a chat room when users book a ride
  async createChatRoom(booking: RideBooking): Promise<string> {
    try {
      const chatRoomData: Omit<ChatRoom, "id"> = {
        name: `${booking.route.from} → ${booking.route.to}`,
        rideId: booking.rideId,
        participants: [booking.userId],
        participantDetails: {
          [booking.userId]: booking.userDetails,
        },
        createdAt: serverTimestamp() as Timestamp,
        route: booking.route,
        deletedFor: [], // Initialize empty array
      };

      const docRef = await addDoc(collection(db, "chatRooms"), chatRoomData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat room:", error);
      throw error;
    }
  }

  // Join an existing chat room (when another user books the same ride)
  async joinChatRoom(
    chatRoomId: string,
    userId: string,
    userDetails: RideBooking["userDetails"],
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);

      await updateDoc(chatRoomRef, {
        participants: arrayUnion(userId),
        [`participantDetails.${userId}`]: userDetails,
        // Remove user from deletedFor array if they're rejoining
        deletedFor: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error joining chat room:", error);
      throw error;
    }
  }

  // Find chat room by ride ID
  async findChatRoomByRide(rideId: string): Promise<string | null> {
    try {
      const q = query(
        collection(db, "chatRooms"),
        where("rideId", "==", rideId),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }

      return null;
    } catch (error) {
      console.error("Error finding chat room:", error);
      throw error;
    }
  }

  // Delete chat room for a specific user (soft delete)
  async deleteChatForUser(chatRoomId: string, userId: string): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const participants = chatRoomData.participants || [];
      const deletedFor = chatRoomData.deletedFor || [];

      // Add current user to deletedFor array
      const updatedDeletedFor = [...deletedFor, userId];

      // Check if all participants have deleted the chat
      const allParticipantsDeleted = participants.every((participantId: string) =>
        updatedDeletedFor.includes(participantId)
      );

      if (allParticipantsDeleted) {
        // If all participants deleted, remove the chat room completely
        await this.permanentlyDeleteChat(chatRoomId);
      } else {
        // Soft delete: just add user to deletedFor array
        await updateDoc(chatRoomRef, {
          deletedFor: arrayUnion(userId),
        });
      }
    } catch (error) {
      console.error("Error deleting chat for user:", error);
      throw error;
    }
  }

  // Permanently delete chat room and all its messages
  async permanentlyDeleteChat(chatRoomId: string): Promise<void> {
    try {
      // Delete all messages in the chat room
      const messagesQuery = query(
        collection(db, "messages"),
        where("chatRoomId", "==", chatRoomId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Delete messages in batches
      const deletePromises = messagesSnapshot.docs.map(messageDoc =>
        deleteDoc(messageDoc.ref)
      );
      
      await Promise.all(deletePromises);

      // Delete the chat room document
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      await deleteDoc(chatRoomRef);
    } catch (error) {
      console.error("Error permanently deleting chat:", error);
      throw error;
    }
  }

  // Restore chat for user (remove from deletedFor array)
  async restoreChatForUser(chatRoomId: string, userId: string): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      
      await updateDoc(chatRoomRef, {
        deletedFor: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Error restoring chat for user:", error);
      throw error;
    }
  }

  // Check if chat is deleted for a specific user
  async isChatDeletedForUser(chatRoomId: string, userId: string): Promise<boolean> {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        return true; // Chat doesn't exist, so it's "deleted"
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const deletedFor = chatRoomData.deletedFor || [];
      
      return deletedFor.includes(userId);
    } catch (error) {
      console.error("Error checking if chat is deleted for user:", error);
      return false;
    }
  }

  // Send a message to a chat room
  async sendMessage(
    chatRoomId: string,
    text: string,
    user: User,
  ): Promise<void> {
    try {
      // Get user details from the chat room
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const userDetails = chatRoomData.participantDetails[user.uid];

      if (!userDetails) {
        throw new Error("User not a participant of this chat");
      }

      // Check if user has deleted this chat
      const deletedFor = chatRoomData.deletedFor || [];
      if (deletedFor.includes(user.uid)) {
        // Restore chat for user when they send a message
        await this.restoreChatForUser(chatRoomId, user.uid);
      }

      // Create the message
      const messageData: Omit<ChatMessage, "id"> = {
        text,
        senderId: user.uid,
        senderName: `${userDetails.firstName} ${userDetails.lastName}`,
        senderEmail: userDetails.email,
        timestamp: serverTimestamp() as Timestamp,
        chatRoomId,
      };

      // Add message to messages collection
      await addDoc(collection(db, "messages"), messageData);

      // Update chat room's last message
      await updateDoc(chatRoomRef, {
        lastMessage: {
          text,
          senderName: messageData.senderName,
          timestamp: serverTimestamp(),
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Subscribe to chat room messages
  subscribeToMessages(
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void,
  ): () => void {
    const q = query(
      collection(db, "messages"),
      where("chatRoomId", "==", chatRoomId),
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage);
      });

      // Sort by timestamp on the client side to avoid composite index requirement
      messages.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      });

      callback(messages);
    });
  }

  // Subscribe to user's chat rooms (excluding deleted ones)
  subscribeToUserChatRooms(
    userId: string,
    callback: (chatRooms: ChatRoom[]) => void,
  ): () => void {
    const q = query(
      collection(db, "chatRooms"),
      where("participants", "array-contains", userId),
    );

    return onSnapshot(q, (querySnapshot) => {
      const chatRooms: ChatRoom[] = [];
      querySnapshot.forEach((doc) => {
        const chatRoomData = {
          id: doc.id,
          ...doc.data(),
        } as ChatRoom;

        // Filter out rooms where this user has deleted the chat
        const deletedFor = chatRoomData.deletedFor || [];
        if (!deletedFor.includes(userId)) {
          chatRooms.push(chatRoomData);
        }
      });

      // Sort by createdAt on the client side to avoid composite index requirement
      chatRooms.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      callback(chatRooms);
    });
  }

  // Get chat room details
  async getChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
    try {
      const docRef = doc(db, "chatRooms", chatRoomId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as ChatRoom;
      }

      return null;
    } catch (error) {
      console.error("Error getting chat room:", error);
      throw error;
    }
  }


  async getAllChatRooms(): Promise<ChatRoom[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "chatRooms"));
      const chatRooms: ChatRoom[] = [];
      
      querySnapshot.forEach((doc) => {
        chatRooms.push({
          id: doc.id,
          ...doc.data(),
        } as ChatRoom);
      });

      return chatRooms;
    } catch (error) {
      console.error("Error getting all chat rooms:", error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
