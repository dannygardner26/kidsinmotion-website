import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

class FirebaseRealtimeService {
  constructor() {
    this.listeners = new Map(); // Track active listeners for cleanup
  }

  // Listen to a specific event document
  subscribeToEvent(eventId, callback, errorCallback) {
    const listenerKey = `event_${eventId}`;

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const eventRef = doc(db, 'events', eventId);
      const unsubscribe = onSnapshot(
        eventRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const eventData = { id: docSnapshot.id, ...docSnapshot.data() };
            callback(eventData);
          } else {
            callback(null);
          }
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Event listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Started listening to event: ${eventId}`);
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to event:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Listen to participants for a specific event
  subscribeToEventParticipants(eventId, callback, errorCallback) {
    const listenerKey = `participants_${eventId}`;

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const participantsRef = collection(db, 'participants');
      const participantsQuery = query(
        participantsRef,
        where('eventId', '==', eventId),
        orderBy('registrationDate', 'desc')
      );

      const unsubscribe = onSnapshot(
        participantsQuery,
        (querySnapshot) => {
          const participants = [];
          querySnapshot.forEach((doc) => {
            participants.push({ id: doc.id, ...doc.data() });
          });
          callback(participants);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Participants listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Started listening to participants for event: ${eventId}`);
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to participants:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Listen to volunteers for a specific event
  subscribeToEventVolunteers(eventId, callback, errorCallback) {
    const listenerKey = `volunteers_${eventId}`;

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const volunteersRef = collection(db, 'volunteers');
      const volunteersQuery = query(
        volunteersRef,
        where('eventId', '==', eventId),
        orderBy('signupDate', 'desc')
      );

      const unsubscribe = onSnapshot(
        volunteersQuery,
        (querySnapshot) => {
          const volunteers = [];
          querySnapshot.forEach((doc) => {
            volunteers.push({ id: doc.id, ...doc.data() });
          });
          callback(volunteers);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Volunteers listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Started listening to volunteers for event: ${eventId}`);
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to volunteers:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Listen to all events
  subscribeToAllEvents(callback, errorCallback) {
    const listenerKey = 'all_events';

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(eventsRef, orderBy('date', 'asc'));

      const unsubscribe = onSnapshot(
        eventsQuery,
        (querySnapshot) => {
          const events = [];
          querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
          });
          callback(events);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Events listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Started listening to all events');
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to events:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Listen to upcoming events only
  subscribeToUpcomingEvents(callback, errorCallback) {
    const listenerKey = 'upcoming_events';

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const eventsRef = collection(db, 'events');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const eventsQuery = query(
        eventsRef,
        where('date', '>=', today),
        orderBy('date', 'asc')
      );

      const unsubscribe = onSnapshot(
        eventsQuery,
        (querySnapshot) => {
          const events = [];
          querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
          });
          callback(events);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Upcoming events listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Started listening to upcoming events');
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to upcoming events:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Listen to user messages for realtime inbox updates
  subscribeToUserMessages(userId, callback, errorCallback) {
    const listenerKey = `user_messages_${userId}`;

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const messagesRef = collection(db, 'users', userId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(
        messagesQuery,
        (querySnapshot) => {
          const messages = [];
          querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
          });
          callback(messages);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('User messages listener error:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Started listening to messages for user: ${userId}`);
      }
      return unsubscribe;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to user messages:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Subscribe to event chat messages
  subscribeToEventChat(eventId, callback, errorCallback) {
    const listenerKey = `chat_${eventId}`;

    // Clean up existing listener if any
    this.unsubscribe(listenerKey);

    try {
      const chatCollection = collection(db, 'events', eventId, 'chat');
      const chatQuery = query(chatCollection, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(chatQuery,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(messages);
        },
        (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error in chat subscription:', error);
          }
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Subscribed to event chat: ${eventId}`);
      }
      return unsubscribe;

    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to subscribe to event chat:', error);
      }
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // Send a message to event chat
  async sendEventChatMessage(eventId, messageData) {
    try {
      const chatCollection = collection(db, 'events', eventId, 'chat');
      const messageWithTimestamp = {
        ...messageData,
        timestamp: serverTimestamp(),
        read: false
      };

      const docRef = await addDoc(chatCollection, messageWithTimestamp);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Chat message sent with ID:', docRef.id);
      }
      return docRef;

    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error sending chat message:', error);
      }
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Mark chat messages as read
  async markChatMessagesAsRead(eventId, messageIds) {
    try {
      const batch = writeBatch(db);

      messageIds.forEach(messageId => {
        const messageRef = doc(db, 'events', eventId, 'chat', messageId);
        batch.update(messageRef, { read: true });
      });

      await batch.commit();
      if (process.env.NODE_ENV !== 'production') {
        console.log('Marked messages as read:', messageIds);
      }

    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error marking messages as read:', error);
      }
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  // Unsubscribe from a specific listener
  unsubscribe(listenerKey) {
    const unsubscribe = this.listeners.get(listenerKey);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerKey);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Unsubscribed from: ${listenerKey}`);
      }
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll() {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Cleaning up ${this.listeners.size} Firestore listeners`);
    }
    this.listeners.forEach((unsubscribe, key) => {
      unsubscribe();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Cleaned up listener: ${key}`);
      }
    });
    this.listeners.clear();
  }

  // Helper method to get listener status
  getActiveListeners() {
    return Array.from(this.listeners.keys());
  }

  // Helper method to check if a specific listener is active
  isListenerActive(listenerKey) {
    return this.listeners.has(listenerKey);
  }
}

// Create a singleton instance
const firebaseRealtimeService = new FirebaseRealtimeService();

export default firebaseRealtimeService;