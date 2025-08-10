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
  createdBy?: string; // Add this field
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

      // Send a system message about the join
      await this.sendSystemMessage(chatRoomId, `${userDetails.firstName} ${userDetails.lastName} joined the chat`);
      
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

// Leave chat room (removes user from participants)
async leaveChatRoom(chatRoomId: string, userId: string): Promise<void> {
  try {
    const chatRoomRef = doc(db, "chatRooms", chatRoomId);
    const chatRoomDoc = await getDoc(chatRoomRef);
    
    if (!chatRoomDoc.exists()) {
      throw new Error("Chat room not found");
    }

    const chatRoomData = chatRoomDoc.data() as ChatRoom;
    const userDetails = chatRoomData.participantDetails[userId];
    
    // Check if user is actually a participant
    if (!chatRoomData.participants?.includes(userId)) {
      throw new Error("User is not a participant of this chat");
    }
    
    // 🔥 SEND SYSTEM MESSAGE FIRST (before removing user)
    if (userDetails) {
      await this.sendSystemMessage(chatRoomId, `${userDetails.firstName} ${userDetails.lastName} left the chat`);
    }
    
    // Then remove user from participants array
    await updateDoc(chatRoomRef, {
      participants: arrayRemove(userId),
      [`participantDetails.${userId}`]: null,
    });

    // Rest of your existing code...
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("rideId", "==", chatRoomData.rideId),
      where("userId", "==", userId)
    );
    
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const updatePromises = bookingsSnapshot.docs.map(bookingDoc =>
      updateDoc(doc(db, "bookings", bookingDoc.id), {
        status: "left"
      })
    );
    
    await Promise.all(updatePromises);

    const rideRef = doc(db, "Rides", chatRoomData.rideId);
    await updateDoc(rideRef, {
      availableSeats: increment(1),
      status: "active"
    });

  } catch (error) {
    console.error("Error leaving chat room:", error);
    throw error;
  }
}



  // Remove participant from chat room (for organizers)
  async removeFromChatRoom(chatRoomId: string, userId: string): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const userDetails = chatRoomData.participantDetails[userId];
      
      // Remove user from participants array
      await updateDoc(chatRoomRef, {
        participants: arrayRemove(userId),
        [`participantDetails.${userId}`]: null,
      });

      // Update related booking
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("rideId", "==", chatRoomData.rideId),
        where("userId", "==", userId)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      // Delete the booking entirely when removed by organizer
      const deletePromises = bookingsSnapshot.docs.map(bookingDoc =>
        deleteDoc(bookingDoc.ref)
      );
      
      await Promise.all(deletePromises);

      // Update ride availability
      const rideRef = doc(db, "Rides", chatRoomData.rideId);
      await updateDoc(rideRef, {
        availableSeats: increment(1),
        status: "active"
      });

      // Send system message about removal
      if (userDetails) {
        await this.sendSystemMessage(chatRoomId, `${userDetails.firstName} ${userDetails.lastName} was removed from the chat`);
      }

    } catch (error) {
      console.error("Error removing user from chat room:", error);
      throw error;
    }
  }

  // Update chat room size (for organizers)
  async updateChatRoomSize(chatRoomId: string, newMaxSize: number): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const currentParticipants = chatRoomData.participants?.length || 0;

      if (newMaxSize < currentParticipants) {
        throw new Error(`Cannot set size below current participant count (${currentParticipants})`);
      }

      // Update the associated ride's total seats
      const rideRef = doc(db, "Rides", chatRoomData.rideId);
      const newAvailableSeats = newMaxSize - currentParticipants;
      
      await updateDoc(rideRef, {
        totalSeats: newMaxSize,
        seats: newMaxSize.toString(),
        availableSeats: newAvailableSeats,
        status: newAvailableSeats > 0 ? "active" : "full"
      });

      // Send system message about size change
      await this.sendSystemMessage(chatRoomId, `Chat room size updated to ${newMaxSize} participants`);

    } catch (error) {
      console.error("Error updating chat room size:", error);
      throw error;
    }
  }

  // Check if user is chat room organizer
  async isChatRoomOrganizer(chatRoomId: string, userId: string): Promise<boolean> {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        return false;
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      
      // Check if user is the ride creator
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

  // Get chat room participants with details
  async getChatRoomParticipants(chatRoomId: string): Promise<Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isOrganizer: boolean;
  }>> {
    try {
      const chatRoomDoc = await getDoc(doc(db, "chatRooms", chatRoomId));
      
      if (!chatRoomDoc.exists()) {
        return [];
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      const participants = chatRoomData.participants || [];
      const participantDetails = chatRoomData.participantDetails || {};

      // Get ride data to determine organizer
      const rideDoc = await getDoc(doc(db, "Rides", chatRoomData.rideId));
      const rideData = rideDoc.exists() ? rideDoc.data() : null;
      const organizerId = rideData?.createdBy || rideData?.userId;

      return participants.map(userId => ({
        userId,
        ...participantDetails[userId],
        isOrganizer: userId === organizerId
      }));

    } catch (error) {
      console.error("Error getting chat room participants:", error);
      return [];
    }
  }

  // Add user to chat room (for organizers to invite)
  async addUserToChatRoom(
    chatRoomId: string, 
    userId: string, 
    userDetails: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    }
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, "chatRooms", chatRoomId);
      const chatRoomDoc = await getDoc(chatRoomRef);
      
      if (!chatRoomDoc.exists()) {
        throw new Error("Chat room not found");
      }

      const chatRoomData = chatRoomDoc.data() as ChatRoom;
      
      // Check if user is already a participant
      if (chatRoomData.participants?.includes(userId)) {
        throw new Error("User is already a participant");
      }

      // Add user to participants
      await updateDoc(chatRoomRef, {
        participants: arrayUnion(userId),
        [`participantDetails.${userId}`]: userDetails,
        deletedFor: arrayRemove(userId),
      });

      // Send system message about addition
      await this.sendSystemMessage(chatRoomId, `${userDetails.firstName} ${userDetails.lastName} was added to the chat`);

    } catch (error) {
      console.error("Error adding user to chat room:", error);
      throw error;
    }
  }

  // Get chat room by ride ID with full details
  async getChatRoomByRideId(rideId: string): Promise<ChatRoom | null> {
    try {
      const q = query(
        collection(db, "chatRooms"),
        where("rideId", "==", rideId)
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

async sendSystemMessage(chatRoomId: string, messageText: string): Promise<void> {
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
      const allParticipantsDeleted = participants.every((participantId: string) =>
        updatedDeletedFor.includes(participantId)
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
        where("chatRoomId", "==", chatRoomId)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc =>
        deleteDoc(messageDoc.ref)
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

      // Sort by timestamp on the client side
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

      // Sort by createdAt on the client side
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

  // Get all chat rooms
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
