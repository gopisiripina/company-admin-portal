import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Demo credentials as fallback
const validCredentials = [
  { email: 'admin@test.com', password: 'admin123', name: 'Admin User', role: 'Admin' },
  { email: 'user@test.com', password: 'user123', name: 'Test User', role: 'User' },
  { email: 'demo@demo.com', password: 'demo123', name: 'Demo User', role: 'Demo' },
];

class AuthService {
  /**
   * Check Firestore credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async checkFirestoreCredentials(email, password) {
    try {
      // Query Firestore for user with matching email
      const usersRef = collection(db, 'users'); // Adjust collection name as needed
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // Check if password matches (Note: In production, use proper password hashing)
        if (userData.password === password) {
          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name || 'User',
            role: userData.role || 'User',
            ...userData
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Firestore authentication error:', error);
      throw error;
    }
  }

  /**
   * Check demo credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} User data or null if not found
   */
  checkDemoCredentials(email, password) {
    const user = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );
    return user || null;
  }

  /**
   * Main authentication method
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(email, password) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      let user = null;
      let authMethod = null;

      // First, try to authenticate with Firestore
      try {
        user = await this.checkFirestoreCredentials(email, password);
        if (user) {
          authMethod = 'firestore';
          console.log('Firestore authentication successful:', user);
        }
      } catch (firestoreError) {
        console.error('Firestore authentication failed:', firestoreError);
        // Continue to demo credentials fallback
      }

      // If Firestore authentication failed, check demo credentials as fallback
      if (!user) {
        user = this.checkDemoCredentials(email, password);
        if (user) {
          authMethod = 'demo';
          console.log('Demo credentials authentication successful:', user);
        }
      }

      return {
        success: !!user,
        user: user,
        authMethod: authMethod,
        error: user ? null : 'Invalid email or password. Please try again.'
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        user: null,
        authMethod: null,
        error: 'An error occurred during login. Please try again.'
      };
    }
  }

  /**
   * Store user data in localStorage
   * @param {Object} user - User data
   * @param {boolean} rememberMe - Whether to remember the user
   */
  storeUserData(user, rememberMe = false) {
    if (rememberMe && user) {
      try {
        localStorage.setItem('userData', JSON.stringify({
          email: user.email,
          name: user.name || 'User',
          role: user.role || 'User'
        }));
        console.log('User data stored in localStorage');
      } catch (error) {
        console.error('Error storing user data:', error);
      }
    }
  }

  /**
   * Get stored user data from localStorage
   * @returns {Object|null} Stored user data or null
   */
  getStoredUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving stored user data:', error);
      return null;
    }
  }

  /**
   * Clear stored user data
   */
  clearStoredUserData() {
    try {
      localStorage.removeItem('userData');
      console.log('User data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing stored user data:', error);
    }
  }

  /**
   * Handle social login (placeholder)
   * @param {string} provider - Social provider name
   * @returns {Promise<Object>} Authentication result
   */
  async socialLogin(provider) {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
    return {
      success: false,
      user: null,
      authMethod: null,
      error: `${provider} login not implemented yet.`
    };
  }

  /**
   * Logout user
   */
  logout() {
    this.clearStoredUserData();
    console.log('User logged out');
  }

  /**
   * Check if user is authenticated (has valid stored data)
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const userData = this.getStoredUserData();
    return !!userData;
  }

  /**
   * Get demo credentials for display purposes
   * @returns {Array} Array of demo credentials
   */
  getDemoCredentials() {
    return validCredentials.map(cred => ({
      email: cred.email,
      password: cred.password,
      role: cred.role
    }));
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;