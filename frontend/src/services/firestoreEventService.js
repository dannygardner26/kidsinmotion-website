import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy } from 'firebase/firestore';

class FirestoreEventService {

  async createEvent(eventData) {
    try {
      console.log('Creating event directly in Firestore:', eventData);

      // Prepare event data for Firestore
      const firestoreEventData = {
        name: eventData.name,
        description: eventData.description || '',
        date: eventData.date,
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        location: eventData.location || '',
        capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
        price: eventData.price ? parseFloat(eventData.price) : 0,
        ageGroup: eventData.ageGroup || '',
        requiresParentSignup: eventData.requiresParentSignup || false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore events collection
      const docRef = await addDoc(collection(db, 'events'), firestoreEventData);

      console.log('Event created with ID:', docRef.id);

      return {
        id: docRef.id,
        ...firestoreEventData
      };
    } catch (error) {
      console.error('Error creating event in Firestore:', error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      console.log('Updating event in Firestore:', eventId, eventData);

      const firestoreEventData = {
        name: eventData.name,
        description: eventData.description || '',
        date: eventData.date,
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        location: eventData.location || '',
        capacity: eventData.capacity ? parseInt(eventData.capacity) : null,
        price: eventData.price ? parseFloat(eventData.price) : 0,
        ageGroup: eventData.ageGroup || '',
        requiresParentSignup: eventData.requiresParentSignup || false,
        updatedAt: new Date().toISOString()
      };

      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, firestoreEventData);

      console.log('Event updated successfully');

      return {
        id: eventId,
        ...firestoreEventData
      };
    } catch (error) {
      console.error('Error updating event in Firestore:', error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      console.log('Deleting event from Firestore:', eventId);

      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);

      console.log('Event deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting event from Firestore:', error);
      throw error;
    }
  }

  async getEvents() {
    try {
      console.log('Fetching events from Firestore');

      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(q);

      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('Fetched events from Firestore:', events);
      return events;
    } catch (error) {
      console.error('Error fetching events from Firestore:', error);
      throw error;
    }
  }

  async getEvent(eventId) {
    try {
      console.log('Fetching single event from Firestore:', eventId);

      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (eventSnap.exists()) {
        const eventData = {
          id: eventSnap.id,
          ...eventSnap.data()
        };
        console.log('Fetched event from Firestore:', eventData);
        return eventData;
      } else {
        console.log('Event not found in Firestore:', eventId);
        throw new Error('Event not found');
      }
    } catch (error) {
      console.error('Error fetching event from Firestore:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const firestoreEventService = new FirestoreEventService();

export default firestoreEventService;