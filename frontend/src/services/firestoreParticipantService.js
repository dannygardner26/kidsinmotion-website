import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';

class FirestoreParticipantService {

  async registerChild(registrationData) {
    try {
      console.log('Registering child in Firestore:', registrationData);

      // Prepare participant data for Firestore
      const participantData = {
        eventId: registrationData.eventId,
        parentFirebaseUid: registrationData.parentFirebaseUid,
        parentEmail: registrationData.parentEmail || '',
        childFirstName: registrationData.childFirstName,
        childLastName: registrationData.childLastName,
        childAge: registrationData.childAge ? parseInt(registrationData.childAge) : null,
        childDateOfBirth: registrationData.childDateOfBirth || '',
        emergencyContact: registrationData.emergencyContact || '',
        medicalInfo: registrationData.medicalInfo || '',
        specialInstructions: registrationData.specialInstructions || '',
        registrationDate: new Date().toISOString(),
        status: 'REGISTERED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore participants collection
      const docRef = await addDoc(collection(db, 'participants'), participantData);

      // Update event's allowedUserIds array to include the parent
      try {
        const eventRef = doc(db, 'events', registrationData.eventId);
        await updateDoc(eventRef, {
          allowedUserIds: arrayUnion(registrationData.parentFirebaseUid)
        });
        console.log('Added parent to event allowedUserIds:', registrationData.parentFirebaseUid);
      } catch (error) {
        console.warn('Failed to update event allowedUserIds:', error);
        // Don't fail the registration if this update fails
      }

      console.log('Child registered with ID:', docRef.id);

      return {
        id: docRef.id,
        ...participantData
      };
    } catch (error) {
      console.error('Error registering child in Firestore:', error);
      throw error;
    }
  }

  async getChildrenByParent(parentFirebaseUid) {
    try {
      console.log('Fetching children for parent from Firestore:', parentFirebaseUid);

      const participantsRef = collection(db, 'participants');
      const q = query(
        participantsRef,
        where('parentFirebaseUid', '==', parentFirebaseUid),
        orderBy('registrationDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const children = [];
      querySnapshot.forEach((doc) => {
        children.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('Fetched children from Firestore:', children);
      return children;
    } catch (error) {
      console.error('Error fetching children from Firestore:', error);
      throw error;
    }
  }

  async getParticipantsByEvent(eventId) {
    try {
      console.log('Fetching participants for event from Firestore:', eventId);

      const participantsRef = collection(db, 'participants');
      const q = query(
        participantsRef,
        where('eventId', '==', eventId),
        orderBy('registrationDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const participants = [];
      querySnapshot.forEach((doc) => {
        participants.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('Fetched participants from Firestore:', participants);
      return participants;
    } catch (error) {
      console.error('Error fetching participants from Firestore:', error);
      throw error;
    }
  }

  async updateParticipant(participantId, updateData) {
    try {
      console.log('Updating participant in Firestore:', participantId, updateData);

      const participantRef = doc(db, 'participants', participantId);
      await updateDoc(participantRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      console.log('Participant updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating participant in Firestore:', error);
      throw error;
    }
  }

  async deleteParticipant(participantId) {
    try {
      console.log('Deleting participant from Firestore:', participantId);

      // Get participant data before deletion to update allowedUserIds
      const participantRef = doc(db, 'participants', participantId);
      const participantDoc = await getDoc(participantRef);

      if (participantDoc.exists()) {
        const participantData = participantDoc.data();

        // Delete the participant
        await deleteDoc(participantRef);

        // Check if this parent has any other participants for this event
        try {
          const participantsQuery = query(
            collection(db, 'participants'),
            where('eventId', '==', participantData.eventId),
            where('parentFirebaseUid', '==', participantData.parentFirebaseUid)
          );
          const remainingParticipants = await getDocs(participantsQuery);

          // If no other participants for this parent and event, remove from allowedUserIds
          if (remainingParticipants.empty) {
            const eventRef = doc(db, 'events', participantData.eventId);
            await updateDoc(eventRef, {
              allowedUserIds: arrayRemove(participantData.parentFirebaseUid)
            });
            console.log('Removed parent from event allowedUserIds:', participantData.parentFirebaseUid);
          }
        } catch (error) {
          console.warn('Failed to update event allowedUserIds after deletion:', error);
        }
      }

      console.log('Participant deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting participant from Firestore:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const firestoreParticipantService = new FirestoreParticipantService();

export default firestoreParticipantService;