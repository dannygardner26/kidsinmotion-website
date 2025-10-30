import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

class FirestoreChildService {
  constructor() {
    this.collectionName = 'children';
  }

  getCurrentUser() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  async getChildren(parentFirebaseUid = null) {
    try {
      const uid = parentFirebaseUid || this.getCurrentUser().uid;

      const q = query(
        collection(db, this.collectionName),
        where('parentFirebaseUid', '==', uid),
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

      return children;
    } catch (error) {
      console.error('Error fetching children from Firestore:', error);
      throw error;
    }
  }

  async getChild(childId) {
    try {
      const docRef = doc(db, this.collectionName, childId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Child not found');
      }
    } catch (error) {
      console.error('Error fetching child from Firestore:', error);
      throw error;
    }
  }

  async createChild(childData) {
    try {
      const user = this.getCurrentUser();

      const childWithMetadata = {
        ...childData,
        parentFirebaseUid: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.collectionName), childWithMetadata);

      return {
        id: docRef.id,
        ...childWithMetadata
      };
    } catch (error) {
      console.error('Error creating child in Firestore:', error);
      throw error;
    }
  }

  async updateChild(childId, childData) {
    try {
      const user = this.getCurrentUser();

      // First verify the child belongs to the current user
      const existingChild = await this.getChild(childId);
      if (existingChild.parentFirebaseUid !== user.uid) {
        throw new Error('Not authorized to update this child');
      }

      const updateData = {
        ...childData,
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, this.collectionName, childId);
      await updateDoc(docRef, updateData);

      return {
        id: childId,
        ...existingChild,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating child in Firestore:', error);
      throw error;
    }
  }

  async deleteChild(childId) {
    try {
      const user = this.getCurrentUser();

      // First verify the child belongs to the current user
      const existingChild = await this.getChild(childId);
      if (existingChild.parentFirebaseUid !== user.uid) {
        throw new Error('Not authorized to delete this child');
      }

      const docRef = doc(db, this.collectionName, childId);
      await deleteDoc(docRef);

      return { success: true, id: childId };
    } catch (error) {
      console.error('Error deleting child from Firestore:', error);
      throw error;
    }
  }
}

const firestoreChildService = new FirestoreChildService();
export default firestoreChildService;