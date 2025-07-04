import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

// Check if the current user is an admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .rpc('is_admin_user', { user_uuid: user.id });

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get admin user details (only works if current user is admin)
export const getAdminUserDetails = async (): Promise<AdminUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // This will only return data if the user is actually an admin due to RLS
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Not an error if user is not admin, just return null
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching admin details:', error);
    return null;
  }
};

// Check if a specific user ID is an admin (for use in other functions)
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('is_admin_user', { user_uuid: userId });

    if (error) {
      console.error('Error checking admin status for user:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error checking admin status for user:', error);
    return false;
  }
};