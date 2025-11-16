import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, orderBy, setDoc } from 'firebase/firestore';

class FirestoreUserService {

  async createUser(userData, firebaseUid) {
    try {
      console.log('Creating user directly in Firestore:', userData);

      // Prepare user data for Firestore
      const firestoreUserData = {
        uid: firebaseUid,
        firebaseUid: firebaseUid, // Add firebaseUid for backend compatibility
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || userData.email?.split('@')[0] || '',
        userType: userData.userType || 'USER',
        roles: userData.roles || ['ROLE_USER'],
        phoneNumber: userData.phoneNumber || '',
        emailVerified: userData.emailVerified || false,
        needsOnboarding: userData.needsOnboarding !== undefined ? userData.needsOnboarding : false,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: userData.lastLoginAt || new Date().toISOString(),
        isActive: true,
        registrationSource: userData.registrationSource || 'firebase'
      };

      // Use setDoc with the Firebase UID as the document ID for easy lookup
      const userRef = doc(db, 'users', firebaseUid);
      await setDoc(userRef, firestoreUserData);

      console.log('User created in Firestore with ID:', firebaseUid);

      return {
        id: firebaseUid,
        ...firestoreUserData
      };
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw error;
    }
  }

  async updateUser(firebaseUid, userData) {
    try {
      console.log('Updating user in Firestore:', firebaseUid, userData);

      const firestoreUserData = {
        ...userData,
        updatedAt: new Date().toISOString()
      };

      const userRef = doc(db, 'users', firebaseUid);
      await updateDoc(userRef, firestoreUserData);

      console.log('User updated successfully in Firestore');

      return {
        id: firebaseUid,
        ...firestoreUserData
      };
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
      throw error;
    }
  }

  async getUser(firebaseUid) {
    try {
      console.log('Fetching user from Firestore:', firebaseUid);

      const userRef = doc(db, 'users', firebaseUid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = {
          id: userSnap.id,
          ...userSnap.data()
        };
        console.log('Fetched user from Firestore:', userData);
        return userData;
      } else {
        console.log('User not found in Firestore:', firebaseUid);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user from Firestore:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      console.log('Fetching all users from Firestore');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('Fetched all users from Firestore:', users.length, 'users');
      return users;
    } catch (error) {
      console.error('Error fetching users from Firestore:', error);
      throw error;
    }
  }

  async deleteUser(firebaseUid) {
    try {
      console.log('Deleting user from Firestore:', firebaseUid);

      const userRef = doc(db, 'users', firebaseUid);
      await deleteDoc(userRef);

      console.log('User deleted successfully from Firestore');
      return true;
    } catch (error) {
      console.error('Error deleting user from Firestore:', error);
      throw error;
    }
  }

  // Method to clear all user registrations when changing account type
  async clearUserRegistrations(firebaseUid) {
    try {
      console.log('Clearing all registrations for user:', firebaseUid);

      // Note: Since we're using Firebase-only mode, we'll update the user document
      // to clear registrations and children. In a full backend implementation,
      // this would also delete from eventRegistrations collection.

      const userRef = doc(db, 'users', firebaseUid);
      await updateDoc(userRef, {
        children: [], // Clear children array
        eventRegistrations: [], // Clear any cached registrations
        updatedAt: new Date().toISOString()
      });

      console.log('User registrations cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing user registrations:', error);
      throw error;
    }
  }

  // Method to ensure user exists in Firestore (for migration/sync purposes)
  async ensureUserExists(firebaseUser, userProfile) {
    try {
      const existingUser = await this.getUser(firebaseUser.uid);

      if (!existingUser) {
        // User doesn't exist in Firestore, create them
        console.log('User not in Firestore, creating:', firebaseUser.email);

        const userData = {
          email: firebaseUser.email,
          firstName: userProfile?.firstName || firebaseUser.displayName?.split(' ')[0] || '',
          lastName: userProfile?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          username: userProfile?.username || firebaseUser.email.split('@')[0],
          userType: userProfile?.userType || 'USER',
          roles: userProfile?.roles || ['ROLE_USER'],
          emailVerified: firebaseUser.emailVerified,
          needsOnboarding: userProfile?.needsOnboarding !== undefined ? userProfile.needsOnboarding : false,
          createdAt: userProfile?.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          firebaseUid: firebaseUser.uid // Add firebaseUid for backend compatibility
        };

        return await this.createUser(userData, firebaseUser.uid);
      } else {
        // User exists, update last login
        await this.updateUser(firebaseUser.uid, {
          lastLoginAt: new Date().toISOString()
        });
        return existingUser;
      }
    } catch (error) {
      console.error('Error ensuring user exists in Firestore:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const firestoreUserService = new FirestoreUserService();

export default firestoreUserService;