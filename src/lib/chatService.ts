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
  increment,
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
  participants: string[];
  participantDetails: {
    [userId: string]: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  createdAt: Timestamp | null;
  createdBy?: string;
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
  deletedFor?: string[];
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
        createdBy: booking.userId,
        route: booking.route,
        deletedFor: [],
      };

      const docRef = await addDoc(collection(db, "chatRooms"), chatRoomData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating chat room:", error);
      throw error;
    }
  }

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
        deletedFor: arrayRemove(userId),
      });

      await this.sendSystemMessage(
        chatRoomId,
        `${userDetails.firstName} ${userDetails.lastName} joined the chat`,
      );
    } catch (error) {
      console.error("Error joining chat room:", error);
      throw error;
    }
  }

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

  async leaveChatRoom(chatRoomId: string, userId: string): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const userDetails = chatRoomData.participantDetails[userId];

      if (!chatRoomData.participants?.includes(userId)) {
        throw new Error("User is not a participant of this chat");
      }

      if (userDetails) {
        await this.sendSystemMessage(
          chatRoomId,
          `${userDetails.firstName} ${userDetails.lastName} left the chat`,
        );
      }

      await updateDoc(chatRoomRef, {
        participants: arrayRemove(userId),
        [`participantDetails.${userId}`]: null,
      });
    } catch (error) {
      console.error("Error leaving chat room:", error);
      throw error;
    }
  }

  async removeFromChatRoom(chatRoomId: string, userId: string): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const userDetails = chatRoomData.participantDetails[userId];

      await updateDoc(chatRoomRef, {
        participants: arrayRemove(userId),
        [`participantDetails.${userId}`]: null,
      });

      if (userDetails) {
        await this.sendSystemMessage(
          chatRoomId,
          `${userDetails.firstName} ${userDetails.lastName} was removed from the chat`,
        );
      }
    } catch (error) {
      console.error("Error removing user from chat room:", error);
      throw error;
    }
  }

  async updateChatRoomSize(
    chatRoomId: string,
    newMaxSize: number,
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const currentParticipants = chatRoomData.participants?.length || 0;

      if (newMaxSize < currentParticipants) {
        throw new Error(
          `Cannot set size below current participant count (${currentParticipants})`,
        );
      }

      await this.sendSystemMessage(
        chatRoomId,
        `Chat room size updated to ${newMaxSize} participants`,
      );
    } catch (error) {
      console.error("Error updating chat room size:", error);
      throw error;
    }
  }

  async isChatRoomOrganizer(
    chatRoomId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));

      if (!chatRoomDoc.exists()) {
        return false;
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;

      const rideDoc = await getDoc(doc(db, "Rides", chatRoomData.rideId));

      if (!rideDoc.exists()) {
        return false;
      }

      const rideData = rideDoc.data();
      return rideData.createdBy === userId || rideData.userId === userId;
    } catch (error) {
      console.error("Error checking if user is organizer:", error);
      return false;
    }
  }

  async getChatRoomParticipants(chatRoomId: string): Promise<
    Array<{
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      isOrganizer: boolean;
    }>
  > {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));

      if (!chatRoomDoc.exists()) {
        return [];
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const participants = chatRoomData.participants || [];
      const participantDetails = chatRoomData.participantDetails || {};

      const rideDoc = await getDoc(doc(db, "Rides", chatRoomData.rideId));
      const rideData = rideDoc.exists() ? rideDoc.data() : null;
      const organizerId = rideData?.createdBy || rideData?.userId;

      return participants.map((userId) => ({
        userId,
        ...participantDetails[userId],
        isOrganizer: userId === organizerId,
      }));
    } catch (error) {
      console.error("Error getting chat room participants:", error);
      return [];
    }
  }

  async addUserToChatRoom(
    chatRoomId: string,
    userId: string,
    userDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    },
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const participants = chatRoomData.participants || [];
      const deletedFor = chatRoomData.deletedFor || [];

      if (participants.includes(userId) && !deletedFor.includes(userId)) {
        throw new Error("User is already an active participant");
      }

      await updateDoc(chatRoomRef, {
        participants: arrayUnion(userId),
        [`participantDetails.${userId}`]: userDetails,
        deletedFor: arrayRemove(userId),
      });

      await this.sendSystemMessage(
        chatRoomId,
        `${userDetails.firstName} ${userDetails.lastName} joined the chat`,
      );
    } catch (error) {
      console.error("Error adding user to chat room:", error);
      throw error;
    }
  }

  async getChatRoomByRideId(rideId: string): Promise<ChatRoom | null> {
    try {
      const q = query(
        collection(db, "chatRooms"),
        where("rideId", "==", rideId),
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as ChatRoom;
      }

      return null;
    } catch (error) {
      console.error("Error getting chat room by ride ID:", error);
      throw error;
    }
  }

  async sendSystemMessage(
    chatRoomId: string,
    messageText: string,
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);

      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const systemMessageData = {
        text: messageText,
        senderId: "system",
        senderName: "System",
        senderEmail: "",
        timestamp: serverTimestamp() as Timestamp,
        chatRoomId,
      };

      await addDoc(collection(db, "messages"), systemMessageData);

      await updateDoc(chatRoomRef, {
        lastMessage: {
          text: messageText,
          senderName: "System",
          timestamp: serverTimestamp(),
        },
      });
    } catch (error) {
      console.error("Error sending system message:", error);
    }
  }

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
      const updatedDeletedFor = [...deletedFor, userId];
      const allParticipantsDeleted = participants.every(
        (participantId: string) => updatedDeletedFor.includes(participantId),
      );

      if (allParticipantsDeleted) {
        await this.permanentlyDeleteChat(chatRoomId);
      } else {
        await updateDoc(chatRoomRef, {
          deletedFor: arrayUnion(userId),
        });
      }
    } catch (error) {
      console.error("Error deleting chat for user:", error);
      throw error;
    }
  }

  async permanentlyDeleteChat(chatRoomId: string): Promise<void> {
    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("chatRoomId", "==", chatRoomId),
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      const deletePromises = messagesSnapshot.docs.map((messageDoc) =>
        deleteDoc(messageDoc.ref),
      );

      await Promise.all(deletePromises);

      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      await deleteDoc(chatRoomRef);
    } catch (error) {
      console.error("Error permanently deleting chat:", error);
      throw error;
    }
  }

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

  async isChatDeletedForUser(
    chatRoomId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));

      if (!chatRoomDoc.exists()) {
        return true;
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const deletedFor = chatRoomData.deletedFor || [];

      return deletedFor.includes(userId);
    } catch (error) {
      console.error("Error checking if chat is deleted for user:", error);
      return false;
    }
  }

  async sendMessage(
    chatRoomId: string,
    text: string,
    user: User,
  ): Promise<void> {
    try {
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

      const deletedFor = chatRoomData.deletedFor || [];
      if (deletedFor.includes(user.uid)) {
        await this.restoreChatForUser(chatRoomId, user.uid);
      }

      const messageData: Omit<ChatMessage, "id"> = {
        text,
        senderId: user.uid,
        senderName: `${userDetails.firstName} ${userDetails.lastName}`,
        senderEmail: userDetails.email,
        timestamp: serverTimestamp() as Timestamp,
        chatRoomId,
      };

      await addDoc(collection(db, "messages"), messageData);

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

      messages.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      });

      callback(messages);
    });
  }

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

        const deletedFor = chatRoomData.deletedFor || [];
        if (!deletedFor.includes(userId)) {
          chatRooms.push(chatRoomData);
        }
      });

      chatRooms.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      callback(chatRooms);
    });
  }

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
