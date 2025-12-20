import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';

class FirestoreTimeslotService {

  // ==================== TIMESLOT CRUD ====================

  async createTimeslot(eventId, slotData) {
    try {
      console.log('Creating timeslot for event:', eventId, slotData);

      const timeslotData = {
        eventId,
        shiftNumber: slotData.shiftNumber,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        capacity: slotData.capacity || 5,
        teamLeadUserId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'eventTimeslots'), timeslotData);
      console.log('Timeslot created with ID:', docRef.id);

      return {
        id: docRef.id,
        ...timeslotData
      };
    } catch (error) {
      console.error('Error creating timeslot:', error);
      throw error;
    }
  }

  async updateTimeslot(slotId, updates) {
    try {
      console.log('Updating timeslot:', slotId, updates);

      const slotRef = doc(db, 'eventTimeslots', slotId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(slotRef, updateData);
      console.log('Timeslot updated successfully');

      return { id: slotId, ...updateData };
    } catch (error) {
      console.error('Error updating timeslot:', error);
      throw error;
    }
  }

  async deleteTimeslot(slotId) {
    try {
      console.log('Deleting timeslot:', slotId);

      // First, get all signups for this timeslot
      const signups = await this.getTimeslotSignups(slotId);

      // Delete all signups for this timeslot
      const batch = writeBatch(db);
      signups.forEach(signup => {
        const signupRef = doc(db, 'timeslotSignups', signup.id);
        batch.delete(signupRef);
      });

      // Delete the timeslot itself
      const slotRef = doc(db, 'eventTimeslots', slotId);
      batch.delete(slotRef);

      await batch.commit();
      console.log('Timeslot and associated signups deleted');

      return { deleted: true, deletedSignups: signups.length };
    } catch (error) {
      console.error('Error deleting timeslot:', error);
      throw error;
    }
  }

  async getTimeslot(slotId) {
    try {
      const slotRef = doc(db, 'eventTimeslots', slotId);
      const slotSnap = await getDoc(slotRef);

      if (slotSnap.exists()) {
        return { id: slotSnap.id, ...slotSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting timeslot:', error);
      throw error;
    }
  }

  async getEventTimeslots(eventId) {
    try {
      console.log('Fetching timeslots for event:', eventId);

      const slotsRef = collection(db, 'eventTimeslots');
      const q = query(
        slotsRef,
        where('eventId', '==', eventId),
        orderBy('shiftNumber', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const timeslots = [];

      querySnapshot.forEach((doc) => {
        timeslots.push({ id: doc.id, ...doc.data() });
      });

      console.log('Fetched timeslots:', timeslots.length);
      return timeslots;
    } catch (error) {
      console.error('Error fetching timeslots:', error);
      throw error;
    }
  }

  // ==================== AUTO-GENERATION ====================

  async generateTimeslots(eventId, startTime, endTime, durationMinutes = 120, defaultCapacity = 5) {
    try {
      console.log('Generating timeslots:', { eventId, startTime, endTime, durationMinutes, defaultCapacity });

      // Parse times (HH:mm format)
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const totalMinutes = endMinutes - startMinutes;

      if (totalMinutes <= 0) {
        throw new Error('End time must be after start time');
      }

      const numberOfSlots = Math.ceil(totalMinutes / durationMinutes);
      const timeslots = [];

      for (let i = 0; i < numberOfSlots; i++) {
        const slotStartMinutes = startMinutes + (i * durationMinutes);
        const slotEndMinutes = Math.min(slotStartMinutes + durationMinutes, endMinutes);

        const slotStartTime = this.minutesToTime(slotStartMinutes);
        const slotEndTime = this.minutesToTime(slotEndMinutes);

        const slotData = {
          shiftNumber: i + 1,
          startTime: slotStartTime,
          endTime: slotEndTime,
          capacity: defaultCapacity
        };

        const createdSlot = await this.createTimeslot(eventId, slotData);
        timeslots.push(createdSlot);
      }

      console.log('Generated timeslots:', timeslots.length);
      return timeslots;
    } catch (error) {
      console.error('Error generating timeslots:', error);
      throw error;
    }
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // ==================== SIGNUP MANAGEMENT ====================

  async signupForTimeslot(timeslotId, eventId, userData) {
    try {
      console.log('Signing up for timeslot:', timeslotId, userData.userId);

      // Check if user is already signed up for this slot
      const existingSignup = await this.isUserSignedUpForSlot(timeslotId, userData.userId);
      if (existingSignup) {
        throw new Error('You are already signed up for this timeslot');
      }

      // Check slot capacity
      const availability = await this.getTimeslotAvailability(timeslotId);
      if (availability.available <= 0) {
        throw new Error('This timeslot is full');
      }

      const signupData = {
        timeslotId,
        eventId,
        userId: userData.userId,
        userEmail: userData.email || '',
        userFirstName: userData.firstName || '',
        userLastName: userData.lastName || '',
        userPhoneNumber: userData.phoneNumber || '',
        signupDate: new Date().toISOString(),
        status: 'CONFIRMED',
        attendanceStatus: null,
        attendanceMarkedAt: null,
        attendanceMarkedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'timeslotSignups'), signupData);
      console.log('Signup created with ID:', docRef.id);

      return {
        id: docRef.id,
        ...signupData
      };
    } catch (error) {
      console.error('Error signing up for timeslot:', error);
      throw error;
    }
  }

  async cancelTimeslotSignup(signupId) {
    try {
      console.log('Cancelling timeslot signup:', signupId);

      const signupRef = doc(db, 'timeslotSignups', signupId);
      await updateDoc(signupRef, {
        status: 'CANCELLED',
        updatedAt: new Date().toISOString()
      });

      console.log('Signup cancelled');
      return { id: signupId, status: 'CANCELLED' };
    } catch (error) {
      console.error('Error cancelling signup:', error);
      throw error;
    }
  }

  async getTimeslotSignups(timeslotId) {
    try {
      const signupsRef = collection(db, 'timeslotSignups');
      const q = query(
        signupsRef,
        where('timeslotId', '==', timeslotId),
        where('status', '==', 'CONFIRMED')
      );

      const querySnapshot = await getDocs(q);
      const signups = [];

      querySnapshot.forEach((doc) => {
        signups.push({ id: doc.id, ...doc.data() });
      });

      return signups;
    } catch (error) {
      console.error('Error getting timeslot signups:', error);
      throw error;
    }
  }

  async getUserTimeslotSignups(userId, eventId = null) {
    try {
      const signupsRef = collection(db, 'timeslotSignups');
      let q;

      if (eventId) {
        q = query(
          signupsRef,
          where('userId', '==', userId),
          where('eventId', '==', eventId),
          where('status', '==', 'CONFIRMED')
        );
      } else {
        q = query(
          signupsRef,
          where('userId', '==', userId),
          where('status', '==', 'CONFIRMED')
        );
      }

      const querySnapshot = await getDocs(q);
      const signups = [];

      querySnapshot.forEach((doc) => {
        signups.push({ id: doc.id, ...doc.data() });
      });

      return signups;
    } catch (error) {
      console.error('Error getting user signups:', error);
      throw error;
    }
  }

  async getUserUpcomingShifts(userId) {
    try {
      const signups = await this.getUserTimeslotSignups(userId);

      const shiftsWithDetails = await Promise.all(
        signups.map(async (signup) => {
          const timeslot = await this.getTimeslot(signup.timeslotId);
          return {
            ...signup,
            timeslot
          };
        })
      );

      return shiftsWithDetails;
    } catch (error) {
      console.error('Error getting upcoming shifts:', error);
      throw error;
    }
  }

  // ==================== AVAILABILITY ====================

  async getTimeslotAvailability(timeslotId) {
    try {
      const timeslot = await this.getTimeslot(timeslotId);
      if (!timeslot) {
        throw new Error('Timeslot not found');
      }

      const signups = await this.getTimeslotSignups(timeslotId);
      const current = signups.length;
      const capacity = timeslot.capacity;
      const available = capacity - current;

      return {
        current,
        capacity,
        available,
        isFull: available <= 0,
        isAlmostFull: available <= Math.ceil(capacity * 0.2) && available > 0
      };
    } catch (error) {
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  async isUserSignedUpForSlot(timeslotId, userId) {
    try {
      const signupsRef = collection(db, 'timeslotSignups');
      const q = query(
        signupsRef,
        where('timeslotId', '==', timeslotId),
        where('userId', '==', userId),
        where('status', '==', 'CONFIRMED')
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking signup:', error);
      throw error;
    }
  }

  async getEventTimeslotsWithAvailability(eventId) {
    try {
      const timeslots = await this.getEventTimeslots(eventId);

      const slotsWithAvailability = await Promise.all(
        timeslots.map(async (slot) => {
          const availability = await this.getTimeslotAvailability(slot.id);
          const signups = await this.getTimeslotSignups(slot.id);
          return {
            ...slot,
            ...availability,
            signups
          };
        })
      );

      return slotsWithAvailability;
    } catch (error) {
      console.error('Error getting slots with availability:', error);
      throw error;
    }
  }

  // ==================== TEAM LEAD ====================

  async assignTeamLead(timeslotId, userId) {
    try {
      console.log('Assigning team lead:', { timeslotId, userId });

      const slotRef = doc(db, 'eventTimeslots', timeslotId);
      await updateDoc(slotRef, {
        teamLeadUserId: userId,
        updatedAt: new Date().toISOString()
      });

      console.log('Team lead assigned');
      return { timeslotId, teamLeadUserId: userId };
    } catch (error) {
      console.error('Error assigning team lead:', error);
      throw error;
    }
  }

  async removeTeamLead(timeslotId) {
    try {
      console.log('Removing team lead from timeslot:', timeslotId);

      const slotRef = doc(db, 'eventTimeslots', timeslotId);
      await updateDoc(slotRef, {
        teamLeadUserId: null,
        updatedAt: new Date().toISOString()
      });

      console.log('Team lead removed');
      return { timeslotId, teamLeadUserId: null };
    } catch (error) {
      console.error('Error removing team lead:', error);
      throw error;
    }
  }

  async getTeamLeadShifts(userId) {
    try {
      const slotsRef = collection(db, 'eventTimeslots');
      const q = query(slotsRef, where('teamLeadUserId', '==', userId));

      const querySnapshot = await getDocs(q);
      const shifts = [];

      querySnapshot.forEach((doc) => {
        shifts.push({ id: doc.id, ...doc.data() });
      });

      return shifts;
    } catch (error) {
      console.error('Error getting team lead shifts:', error);
      throw error;
    }
  }

  // ==================== ATTENDANCE ====================

  async markAttendance(signupId, status, markedByUserId) {
    try {
      console.log('Marking attendance:', { signupId, status, markedByUserId });

      const validStatuses = ['PRESENT', 'LATE', 'LEFT_EARLY', 'NO_SHOW'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid attendance status');
      }

      const signupRef = doc(db, 'timeslotSignups', signupId);
      await updateDoc(signupRef, {
        attendanceStatus: status,
        attendanceMarkedAt: new Date().toISOString(),
        attendanceMarkedBy: markedByUserId,
        updatedAt: new Date().toISOString()
      });

      console.log('Attendance marked');
      return { signupId, attendanceStatus: status };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getShiftAttendance(timeslotId) {
    try {
      const signups = await this.getTimeslotSignups(timeslotId);

      const attendance = {
        total: signups.length,
        present: 0,
        late: 0,
        leftEarly: 0,
        noShow: 0,
        unmarked: 0
      };

      signups.forEach(signup => {
        switch (signup.attendanceStatus) {
          case 'PRESENT':
            attendance.present++;
            break;
          case 'LATE':
            attendance.late++;
            break;
          case 'LEFT_EARLY':
            attendance.leftEarly++;
            break;
          case 'NO_SHOW':
            attendance.noShow++;
            break;
          default:
            attendance.unmarked++;
        }
      });

      return attendance;
    } catch (error) {
      console.error('Error getting shift attendance:', error);
      throw error;
    }
  }

  // ==================== BULK OPERATIONS ====================

  async deleteAllEventTimeslots(eventId) {
    try {
      console.log('Deleting all timeslots for event:', eventId);

      const timeslots = await this.getEventTimeslots(eventId);

      for (const slot of timeslots) {
        await this.deleteTimeslot(slot.id);
      }

      console.log('All timeslots deleted for event');
      return { deleted: timeslots.length };
    } catch (error) {
      console.error('Error deleting all timeslots:', error);
      throw error;
    }
  }
}

const firestoreTimeslotService = new FirestoreTimeslotService();

export default firestoreTimeslotService;
