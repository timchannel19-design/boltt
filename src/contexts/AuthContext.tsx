import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { trackUserRegistration, trackTherapistRegistration } from '../utils/analyticsManager';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'therapist' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
  profilePicture?: string;
  emergencyContactEmail?: string;
  emergencyContactRelation?: string;
  age?: number;
  specialization?: string;
  experience?: string;
  location?: string;
  hourlyRate?: number;
  licenseNumber?: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'therapist';
  emergencyContactEmail?: string;
  emergencyContactRelation?: string;
  age?: number;
  specialization?: string;
  experience?: string;
  hourlyRate?: number;
  licenseNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('mindcare_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Listen for user updates from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mindcare_user' && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    setLoading(false);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string, role?: string): Promise<boolean> => {
    try {
      // Load all registered users from localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      
      // Predefined demo users
      const demoUsers = [
        {
          id: '1',
          email: 'patient@example.com',
          name: 'John Doe',
          role: 'patient' as const,
          emergencyContactEmail: 'emergency@example.com',
          emergencyContactRelation: 'parent',
          age: 28
        },
        {
          id: '2',
          email: 'therapist@example.com',
          name: 'Dr. Sarah Smith',
          role: 'therapist' as const,
          specialization: 'Cognitive Behavioral Therapy',
          hourlyRate: 120,
          licenseNumber: 'LIC123456',
          verified: true
        },
        {
          id: '3',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin' as const
        }
      ];
      
      // Combine demo users with registered users
      const allUsers = [...demoUsers, ...registeredUsers];

      // Find user by email first, then check role if specified
      const foundUser = allUsers.find(u => u.email === email);
      
      // Check if user exists and password matches (demo users use 'password', registered users use their actual password)
      const isValidPassword = foundUser && (
        password === 'password' || // Demo users
        (registeredUsers.some((u: any) => u.email === email) && password.length >= 8) // Registered users (simplified check)
      );
      
      // Check role if specified
      const roleMatches = !role || foundUser?.role === role;
      
      if (foundUser && isValidPassword && roleMatches) {
        setUser(foundUser);
        localStorage.setItem('mindcare_user', JSON.stringify(foundUser));
        toast.success('Login successful!');
        return true;
      } else {
        if (!foundUser) {
          toast.error('User not found. Please check your email or register first.');
        } else if (!isValidPassword) {
          toast.error('Invalid password');
        } else if (!roleMatches) {
          toast.error(`This account is not registered as a ${role}`);
        }
        return false;
      }
    } catch (error) {
      toast.error('Login failed');
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Load existing registered users
      const existingUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      
      // Check if user already exists
      if (existingUsers.some((u: any) => u.email === userData.email)) {
        toast.error('User with this email already exists');
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.role === 'therapist' ? 'pending' : undefined,
        ...(userData.emergencyContactEmail && { emergencyContactEmail: userData.emergencyContactEmail }),
        ...(userData.emergencyContactRelation && { emergencyContactRelation: userData.emergencyContactRelation }),
        ...(userData.age && { age: userData.age }),
        ...(userData.specialization && { specialization: userData.specialization }),
        ...(userData.location && { location: userData.location }),
        ...(userData.hourlyRate && { hourlyRate: userData.hourlyRate }),
        ...(userData.licenseNumber && { licenseNumber: userData.licenseNumber }),
        verified: userData.role === 'patient'
      };

      // Save to registered users list
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('mindcare_registered_users', JSON.stringify(updatedUsers));

      setUser(newUser);
      localStorage.setItem('mindcare_user', JSON.stringify(newUser));
      
      // Track user registration in analytics
      trackUserRegistration(newUser);
      
      // If therapist, also track therapist registration
      if (userData.role === 'therapist') {
        trackTherapistRegistration({
          therapistId: newUser.id,
          therapistName: newUser.name,
          specialization: [userData.specialization || 'General Therapy']
        });
      }
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error('Registration failed');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mindcare_user');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}