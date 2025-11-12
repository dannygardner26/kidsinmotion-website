import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';

class FirestoreChildrenService {

  async createChild(childData, parentFirebaseUid) {
    try {
      console.log('Creating child directly in Firestore:', childData);

      // Prepare child data for Firestore
      const firestoreChildData = {
        firstName: childData.firstName || '',
        lastName: childData.lastName || '',
        age: childData.age ? parseInt(childData.age) : null,
        grade: childData.grade || '',
        baseballExperience: childData.baseballExperience || '',
        medicalConcerns: childData.medicalConcerns || '',
        foodAllergies: childData.foodAllergies || '',
        additionalInformation: childData.additionalInformation || '',
        parentFirebaseUid: parentFirebaseUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore children collection
      const docRef = await addDoc(collection(db, 'children'), firestoreChildData);

      console.log('Child created with ID:', docRef.id);

      return {
        id: docRef.id,
        ...firestoreChildData
      };
    } catch (error) {
      console.error('Error creating child in Firestore:', error);
      throw error;
    }
  }

  async updateChild(childId, childData) {
    try {
      console.log('Updating child in Firestore:', childId, childData);

      const firestoreChildData = {
        firstName: childData.firstName || '',
        lastName: childData.lastName || '',
        age: childData.age ? parseInt(childData.age) : null,
        grade: childData.grade || '',
        baseballExperience: childData.baseballExperience || '',
        medicalConcerns: childData.medicalConcerns || '',
        foodAllergies: childData.foodAllergies || '',
        additionalInformation: childData.additionalInformation || '',
        updatedAt: new Date().toISOString()
      };

      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, firestoreChildData);

      console.log('Child updated successfully in Firestore');

      return {
        id: childId,
        ...firestoreChildData
      };
    } catch (error) {
      console.error('Error updating child in Firestore:', error);
      throw error;
    }
  }

  async deleteChild(childId) {
    try {
      console.log('Deleting child from Firestore:', childId);

      const childRef = doc(db, 'children', childId);
      await deleteDoc(childRef);

      console.log('Child deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting child from Firestore:', error);
      throw error;
    }
  }

  async getChildren(parentFirebaseUid) {
    try {
      console.log('Fetching children from Firestore for parent:', parentFirebaseUid);

      const childrenRef = collection(db, 'children');
      const q = query(
        childrenRef,
        where('parentFirebaseUid', '==', parentFirebaseUid),
        orderBy('createdAt', 'desc')
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

  async getChild(childId) {
    try {
      console.log('Fetching single child from Firestore:', childId);

      const childRef = doc(db, 'children', childId);
      const childSnap = await getDoc(childRef);

      if (childSnap.exists()) {
        const childData = {
          id: childSnap.id,
          ...childSnap.data()
        };
        console.log('Fetched child from Firestore:', childData);
        return childData;
      } else {
        console.log('Child not found in Firestore:', childId);
        throw new Error('Child not found');
      }
    } catch (error) {
      console.error('Error fetching child from Firestore:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const firestoreChildrenService = new FirestoreChildrenService();

export default firestoreChildrenService;