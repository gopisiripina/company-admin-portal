import { supabase, supabaseAdmin } from '../supabase/config';

// Demo credentials as fallback
const validCredentials = [
  { email: 'admin@test.com', password: 'admin123', name: 'Admin User', role: 'Admin' },
  { email: 'user@test.com', password: 'user123', name: 'Test User', role: 'User' },
  { email: 'demo@demo.com', password: 'demo123', name: 'Demo User', role: 'Demo' },
];

class AuthService {
  /**
   * Update user's isActive status in Supabase
   * @param {string} userId - User document ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<boolean>} Success status
   */
  async updateUserActiveStatus(userId, isActive) {
    try {
      if (!userId) {
        console.log('No userId provided for status update');
        return false;
      }

      // Use admin client for privileged operations
      const { error } = await supabase
        .from('users')
        .update({
          isactive: isActive, // Changed to match your schema
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user active status:', error);
        return false;
      }
      
      
      return true;
    } catch (error) {
      console.error('Error updating user active status:', error);
      return false;
    }
  }

  /**
   * Check Supabase credentials using custom authentication
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} User data or null if not found
   */
  async checkSupabaseCredentials(email, password) {
    try {
      // Use admin client to bypass RLS for authentication
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Database connection error');
      }

      // Check if we got any users back
      if (users && users.length > 0) {
        const userData = users[0];
        
        
        // Check if password matches (Note: In production, use proper password hashing)
        if (userData.password === password) {
          // Update isActive to true when user successfully logs in
          await this.updateUserActiveStatus(userData.id, true);
          
          // Convert date strings to Date objects if needed
          const createdAt = userData.createdat ? new Date(userData.createdat) : new Date();
          const updatedat = new Date(); // Current time for login
          
          // Construct the user object matching your schema
          const user = {
            id: userData.id,
            email: userData.email,
            name: userData.name || 'User',
            role: userData.role || 'User',
            profileimage: userData.profileimage, // Note: using profileimage from schema
            photoURL: userData.photourl,
            isActive: true, // Set to true since user just logged in
            employeeId: userData.employee_id,
            isFirstLogin: userData.isfirstlogin !== undefined ? userData.isfirstlogin : false,
            createdAt: userData.created_at ? new Date(userData.created_at) : new Date(),
            created_at: userData.created_at || userData.createdat || null,
            updatedAt: new Date(),
            employee_type:userData.employee_type,
            password: undefined,
            mobile: userData.mobile,
            work_phone:userData.work_phone,
            address:userData.address,
            birth_date:userData.birth_date,
            education:userData.education,
            total_experience:userData.total_experience,
            technical_skills:userData.technical_skills,
            certifications:userData.certifications,
            languages:userData.languages,
            linkedin_url:userData.linkedin_url,
            github_url:userData.github_url,
            twitter_url:userData.twitter_url,
            pay:userData.pay,
            department:userData.department,
            // createdAt: createdAt
          };
          
         
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Supabase authentication error:', error);
      throw error;
    }
  }

/**
 * Change password for first-time login users (Plain text - NOT RECOMMENDED for production)
 * @param {string} userId - User document ID from your custom users table
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result object with success status
 */
async changeFirstLoginPassword(userId, newPassword) {
  try {
    if (!userId || !newPassword) {
      return {
        success: false,
        error: 'User ID and new password are required'
      };
    }

    console.log('Updating custom users table for user:', userId);

    // Update your custom users table (NOT Supabase Auth)
    const { data, error } = await supabaseAdmin
  .from('users')
  .update({
    password: newPassword,
    isfirstlogin: false,
    updated_at: new Date().toISOString()  // ✅ Correct - matches your schema
  })
  .eq('id', userId)
  .select()
    if (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: 'Failed to change password. Please try again.'
      };
    }

    // Check if any rows were updated
    console.log('Update result:', data);
    
    // Verify the update worked by checking if user exists
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, isfirstlogin')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying user update:', verifyError);
      return {
        success: false,
        error: 'Failed to verify password change.'
      };
    }

    console.log('User after update:', verifyUser);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      error: 'Failed to change password. Please try again.'
    };
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
    
    if (user) {
      return {
        ...user,
        id: `demo_${Date.now()}`,
        isActive: true,
        isFirstLogin: false,
        createdAt: new Date(),
        updateat: new Date()
      };
    }
    
    return null;
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

      // First, try to authenticate with Supabase
      try {
        user = await this.checkSupabaseCredentials(email, password);
        if (user) {
          authMethod = 'supabase';
          
        }
      } catch (supabaseError) {
        console.error('Supabase authentication failed:', supabaseError);
        // Continue to demo credentials fallback
      }

      // If Supabase authentication failed, check demo credentials as fallback
      if (!user) {
        user = this.checkDemoCredentials(email, password);
        if (user) {
          authMethod = 'demo';
          console.log('Demo credentials authentication successful:', user);
        }
      }

      const result = {
        success: !!user,
        user: user,
        authMethod: authMethod,
        isFirstLogin: user?.isFirstLogin || false,
        error: user ? null : 'Invalid email or password. Please try again.'
      };

      
      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        user: null,
        authMethod: null,
        isFirstLogin: false,
        error: 'An error occurred during login. Please try again.'
      };
    }
  }

  // Rest of the methods remain the same...
  storeUserData(user, rememberMe = false) {
  if (user) {
    try {
      
      const dataToStore = {
        id: user.id,
        email: user.email,
        name: user.name || 'User',
        role: user.role || 'User',
        profileimage: user.profileimage,
        photoURL: user.photoURL,
        isActive: user.isActive,
        isFirstLogin: user.isFirstLogin || false,
        employeeId: user.employeeId,
        mobile: user.mobile,
        work_phone: user.work_phone,
        employee_type: user.employee_type,    
        address: user.address,                
        birth_date: user.birth_date,          
        education: user.education,            
        total_experience: user.total_experience, 
        technical_skills: user.technical_skills, 
        certifications: user.certifications,     
        languages: user.languages,
        pay: user.pay,               
        linkedin_url: user.linkedin_url,         
        github_url: user.github_url,             
        twitter_url: user.twitter_url,           
        department: user.department,             
        createdAt: user.createdAt,
        created_at: user.created_at,
        updatedAt: user.updatedAt
      };
      
      
      
      if (rememberMe) {
        localStorage.setItem('userData', JSON.stringify(dataToStore));
        sessionStorage.removeItem('userData');
      } else {
        sessionStorage.setItem('userData', JSON.stringify(dataToStore));
        localStorage.removeItem('userData');
      }
      
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }
}
  getStoredUserData() {
  try {
 
    
    // Check localStorage first (remember me - persistent)
    let userData = localStorage.getItem('userData');
    
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('Retrieved stored user data from localStorage:', parsedData);
      return parsedData;
    }
    
    // Check sessionStorage (current session only)
    userData = sessionStorage.getItem('userData');
   
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      
      return parsedData;
    }
    
    
    return null;
  } catch (error) {
    console.error('Error retrieving stored user data:', error);
    return null;
  }
}

  clearStoredUserData() {
  try {
    // Clear both localStorage and sessionStorage
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    
  } catch (error) {
    console.error('Error clearing stored user data:', error);
  }
}

  async socialLogin(provider) {
    console.log(`Login with ${provider}`);
    return {
      success: false,
      user: null,
      authMethod: null,
      error: `${provider} login not implemented yet.`
    };
  }

  async logout(userData = null) {
    try {
      const currentUser = userData || this.getStoredUserData();
      
      if (currentUser && currentUser.id) {
        if (currentUser.id && !currentUser.id.startsWith('demo_')) {
         
          await this.updateUserActiveStatus(userData.id, false);
        } else {
          console.log('Demo user logout - no Supabase update needed');
        }
      }
      
      this.clearStoredUserData();
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      this.clearStoredUserData();
      return false;
    }
  }

  isAuthenticated() {
    const userData = this.getStoredUserData();
    const isAuth = !!userData;
    console.log('Authentication check:', isAuth, 'isActive:', userData?.isActive);
    return isAuth;
  }

  getCurrentUserActiveStatus() {
    const userData = this.getStoredUserData();
    return userData?.isActive || false;
  }

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