import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

class FirebaseRealtimeTimeslotService {
  constructor() {
    this.listeners = new Map();
  }

  // ==================== TIMESLOT LISTENERS ====================

  /**
   * Subscribe to all timeslots for an event
   */
  subscribeToEventTimeslots(eventId, callback, errorCallback) {
    const listenerKey = `event_timeslots_${eventId}`;

    // Clean up existing listener
    this.unsubscribe(listenerKey);

    try {
      const slotsRef = collection(db, 'eventTimeslots');
      const q = query(
        slotsRef,
        where('eventId', '==', eventId),
        orderBy('shiftNumber', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const timeslots = [];
          querySnapshot.forEach((doc) => {
            timeslots.push({ id: doc.id, ...doc.data() });
          });
          callback(timeslots);
        },
        (error) => {
          console.error('Event timeslots listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      console.log(`Started listening to timeslots for event: ${eventId}`);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to event timeslots:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  /**
   * Subscribe to a single timeslot
   */
  subscribeToTimeslot(timeslotId, callback, errorCallback) {
    const listenerKey = `timeslot_${timeslotId}`;

    this.unsubscribe(listenerKey);

    try {
      const slotRef = doc(db, 'eventTimeslots', timeslotId);

      const unsubscribe = onSnapshot(
        slotRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            callback({ id: docSnapshot.id, ...docSnapshot.data() });
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Timeslot listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to timeslot:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // ==================== SIGNUP LISTENERS ====================

  /**
   * Subscribe to all signups for a timeslot
   */
  subscribeToTimeslotSignups(timeslotId, callback, errorCallback) {
    const listenerKey = `timeslot_signups_${timeslotId}`;

    this.unsubscribe(listenerKey);

    try {
      const signupsRef = collection(db, 'timeslotSignups');
      const q = query(
        signupsRef,
        where('timeslotId', '==', timeslotId),
        where('status', '==', 'CONFIRMED')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const signups = [];
          querySnapshot.forEach((doc) => {
            signups.push({ id: doc.id, ...doc.data() });
          });
          callback(signups);
        },
        (error) => {
          console.error('Timeslot signups listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to timeslot signups:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  /**
   * Subscribe to all signups for an event (across all timeslots)
   */
  subscribeToEventTimeslotSignups(eventId, callback, errorCallback) {
    const listenerKey = `event_timeslot_signups_${eventId}`;

    this.unsubscribe(listenerKey);

    try {
      const signupsRef = collection(db, 'timeslotSignups');
      const q = query(
        signupsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'CONFIRMED')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const signups = [];
          querySnapshot.forEach((doc) => {
            signups.push({ id: doc.id, ...doc.data() });
          });
          callback(signups);
        },
        (error) => {
          console.error('Event timeslot signups listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to event timeslot signups:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  /**
   * Subscribe to a user's timeslot signups
   */
  subscribeToUserShifts(userId, callback, errorCallback) {
    const listenerKey = `user_shifts_${userId}`;

    this.unsubscribe(listenerKey);

    try {
      const signupsRef = collection(db, 'timeslotSignups');
      const q = query(
        signupsRef,
        where('userId', '==', userId),
        where('status', '==', 'CONFIRMED')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const shifts = [];
          querySnapshot.forEach((doc) => {
            shifts.push({ id: doc.id, ...doc.data() });
          });
          callback(shifts);
        },
        (error) => {
          console.error('User shifts listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      console.log(`Started listening to shifts for user: ${userId}`);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to user shifts:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // ==================== TEAM LEAD LISTENERS ====================

  /**
   * Subscribe to shifts where user is team lead
   */
  subscribeToTeamLeadShifts(userId, callback, errorCallback) {
    const listenerKey = `team_lead_shifts_${userId}`;

    this.unsubscribe(listenerKey);

    try {
      const slotsRef = collection(db, 'eventTimeslots');
      const q = query(slotsRef, where('teamLeadUserId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const shifts = [];
          querySnapshot.forEach((doc) => {
            shifts.push({ id: doc.id, ...doc.data() });
          });
          callback(shifts);
        },
        (error) => {
          console.error('Team lead shifts listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      this.listeners.set(listenerKey, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to team lead shifts:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // ==================== COMBINED LISTENERS ====================

  /**
   * Subscribe to timeslots with their signups for an event
   * Returns timeslots with nested signup counts
   */
  subscribeToEventTimeslotsWithSignups(eventId, callback, errorCallback) {
    const listenerKey = `event_timeslots_with_signups_${eventId}`;

    // We need to manage multiple listeners
    const timeslotListenerKey = `${listenerKey}_slots`;
    const signupsListenerKey = `${listenerKey}_signups`;

    this.unsubscribe(timeslotListenerKey);
    this.unsubscribe(signupsListenerKey);

    let currentTimeslots = [];
    let currentSignups = [];

    const updateCallback = () => {
      // Group signups by timeslotId
      const signupsBySlot = {};
      currentSignups.forEach(signup => {
        if (!signupsBySlot[signup.timeslotId]) {
          signupsBySlot[signup.timeslotId] = [];
        }
        signupsBySlot[signup.timeslotId].push(signup);
      });

      // Merge timeslots with their signups
      const timeslotsWithSignups = currentTimeslots.map(slot => ({
        ...slot,
        signups: signupsBySlot[slot.id] || [],
        current: (signupsBySlot[slot.id] || []).length,
        available: slot.capacity - (signupsBySlot[slot.id] || []).length,
        isFull: (signupsBySlot[slot.id] || []).length >= slot.capacity,
        isAlmostFull: slot.capacity - (signupsBySlot[slot.id] || []).length <= Math.ceil(slot.capacity * 0.2) &&
                      (signupsBySlot[slot.id] || []).length < slot.capacity
      }));

      callback(timeslotsWithSignups);
    };

    try {
      // Listen to timeslots
      const slotsRef = collection(db, 'eventTimeslots');
      const slotsQuery = query(
        slotsRef,
        where('eventId', '==', eventId),
        orderBy('shiftNumber', 'asc')
      );

      const slotsUnsubscribe = onSnapshot(
        slotsQuery,
        (querySnapshot) => {
          currentTimeslots = [];
          querySnapshot.forEach((doc) => {
            currentTimeslots.push({ id: doc.id, ...doc.data() });
          });
          updateCallback();
        },
        (error) => {
          console.error('Timeslots listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      // Listen to signups
      const signupsRef = collection(db, 'timeslotSignups');
      const signupsQuery = query(
        signupsRef,
        where('eventId', '==', eventId),
        where('status', '==', 'CONFIRMED')
      );

      const signupsUnsubscribe = onSnapshot(
        signupsQuery,
        (querySnapshot) => {
          currentSignups = [];
          querySnapshot.forEach((doc) => {
            currentSignups.push({ id: doc.id, ...doc.data() });
          });
          updateCallback();
        },
        (error) => {
          console.error('Signups listener error:', error);
          if (errorCallback) errorCallback(error);
        }
      );

      // Store both unsubscribe functions
      this.listeners.set(timeslotListenerKey, slotsUnsubscribe);
      this.listeners.set(signupsListenerKey, signupsUnsubscribe);

      console.log(`Started listening to timeslots with signups for event: ${eventId}`);

      // Return a combined unsubscribe function
      return () => {
        slotsUnsubscribe();
        signupsUnsubscribe();
        this.listeners.delete(timeslotListenerKey);
        this.listeners.delete(signupsListenerKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to event timeslots with signups:', error);
      if (errorCallback) errorCallback(error);
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  unsubscribe(listenerKey) {
    const unsubscribe = this.listeners.get(listenerKey);
    if (unsubscribe && typeof unsubscribe === 'function') {
      try {
        unsubscribe();
        this.listeners.delete(listenerKey);
        console.log(`Unsubscribed from: ${listenerKey}`);
      } catch (error) {
        console.warn(`Failed to unsubscribe from ${listenerKey}:`, error);
      }
    }
  }

  unsubscribeAll() {
    console.log(`Cleaning up ${this.listeners.size} timeslot listeners`);
    this.listeners.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  getActiveListeners() {
    return Array.from(this.listeners.keys());
  }
}

const firebaseRealtimeTimeslotService = new FirebaseRealtimeTimeslotService();

export default firebaseRealtimeTimeslotService;
