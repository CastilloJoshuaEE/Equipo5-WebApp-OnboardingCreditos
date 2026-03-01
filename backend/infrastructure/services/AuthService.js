// backend/infrastructure/services/AuthService.js
class AuthService {
  constructor(supabase, supabaseAdmin) {
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin;
  }

  async signInWithPassword(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async signUp(email, password, userData) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async refreshSession(refreshToken) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getSession() {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getUserById(userId) {
    try {
      const { data, error } = await this.supabaseAdmin.auth.admin.getUserById(userId);
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      const { data: { users }, error } = await this.supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      return users.find(u => u.email === email);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUserPassword(newPassword) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async updateUserById(userId, newPassword) {
    try {
      const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async resetPasswordForEmail(email) {
    try {
      const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contrasena`
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  }

  async deleteUser(userId) {
    try {
      const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
}

module.exports = AuthService;