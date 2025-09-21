import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCheck, Search, Filter, Plus, Eye, Edit, Trash2, 
  Shield, CheckCircle, XCircle, AlertTriangle, Star,
  Mail, Phone, Calendar, Award, DollarSign, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { trackTherapistApproval } from '../utils/analyticsManager';

interface Therapist {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: string;
  licenseNumber: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  patientsCount: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  verified: boolean;
  joinDate: string;
  lastLogin: string;
  bio: string;
  languages: string[];
  profilePicture?: string;
  qualification?: string;
}

function TherapistsManagementPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);

  useEffect(() => {
    loadTherapists();
    
    // Set up interval to refresh data
    const interval = setInterval(loadTherapists, 5000);
    
    // Listen for approval/rejection events from Admin Dashboard
    const handleTherapistApproved = (event: any) => {
      const { therapistId } = event.detail;
      loadTherapists(); // Refresh the therapists list
    };
    
    const handleTherapistRejected = (event: any) => {
      const { therapistId } = event.detail;
      loadTherapists(); // Refresh the therapists list
    };
    
    window.addEventListener('mindcare-therapist-approved', handleTherapistApproved);
    window.addEventListener('mindcare-therapist-rejected', handleTherapistRejected);
    
      window.removeEventListener('mindcare-therapist-approved', handleTherapistApproved);
      window.removeEventListener('mindcare-therapist-rejected', handleTherapistRejected);
    return () => clearInterval(interval);
  }, []);

  const loadTherapists = () => {
    // Load registered therapists
    const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
    const therapistUsers = registeredUsers.filter((u: any) => u.role === 'therapist');
    
    // Load approved therapist services
    const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
    const approvedServices = therapistServices.filter((service: any) => service.status === 'approved');
    
    // Combine data from both sources
    const combinedTherapists: Therapist[] = [];
    
    // Add demo therapists
    const demoTherapists = [
      {
        id: '2',
        name: 'Dr. Sarah Smith',
        email: 'therapist@example.com',
        phone: '+1 (555) 123-4567',
        specialization: ['CBT', 'Anxiety', 'Depression'],
        experience: '8 years',
        licenseNumber: 'LIC123456',
        hourlyRate: 120,
        rating: 4.9,
        reviewCount: 127,
        patientsCount: 28,
        status: 'active' as const,
        verified: true,
        joinDate: '2023-03-15',
        lastLogin: '2024-01-15',
        bio: 'Experienced clinical psychologist specializing in cognitive behavioral therapy.',
        languages: ['English', 'Spanish'],
        qualification: 'Ph.D. in Clinical Psychology'
      }
    ];
    
    combinedTherapists.push(...demoTherapists);
    
    // Add registered therapists
    therapistUsers.forEach((therapistUser: any) => {
      const service = approvedServices.find((s: any) => s.therapistId === therapistUser.id);
      const pendingService = therapistServices.find((s: any) => s.therapistId === therapistUser.id && s.status === 'pending');
      const rejectedService = therapistServices.find((s: any) => s.therapistId === therapistUser.id && s.status === 'rejected');
      
      const therapist: Therapist = {
        id: therapistUser.id,
        name: therapistUser.name,
        email: therapistUser.email,
        phone: therapistUser.phone || '+1 (555) 000-0000',
        specialization: (service || pendingService || rejectedService)?.specialization || [therapistUser.specialization || 'General Therapy'],
        experience: (service || pendingService || rejectedService)?.experience || '5 years',
        licenseNumber: therapistUser.licenseNumber || 'LIC000000',
        hourlyRate: (service || pendingService || rejectedService)?.chargesPerSession || therapistUser.hourlyRate || 100,
        rating: 4.5,
        reviewCount: 0,
        patientsCount: 0,
        status: service ? 'active' : pendingService ? 'pending' : rejectedService ? 'inactive' : 'pending',
        verified: !!service,
        joinDate: therapistUser.joinDate || new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
        bio: (service || pendingService || rejectedService)?.bio || 'Professional therapist committed to helping patients achieve mental wellness.',
        languages: (service || pendingService || rejectedService)?.languages || ['English'],
        profilePicture: (service || pendingService || rejectedService)?.profilePicture,
        qualification: (service || pendingService || rejectedService)?.qualification || therapistUser.qualification
      };
      
      combinedTherapists.push(therapist);
    });
    
    setTherapists(combinedTherapists);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const handleTherapistAction = (therapistId: string, action: string) => {
    if (action === 'approved') {
      // Update therapist services status first
      const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
      const serviceToApprove = therapistServices.find((s: any) => s.therapistId === therapistId);
      const updatedServices = therapistServices.map((s: any) => 
        s.therapistId === therapistId ? { ...s, status: 'approved', approvedAt: new Date().toISOString() } : s
      );
      localStorage.setItem('mindcare_therapist_services', JSON.stringify(updatedServices));
      
      // Update registered users
      const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      const updatedUsers = registeredUsers.map((u: any) => 
        u.id === therapistId ? { ...u, status: 'approved', verified: true } : u
      );
      localStorage.setItem('mindcare_registered_users', JSON.stringify(updatedUsers));
      
      // Add to available therapists for booking
      if (serviceToApprove) {
        const availableTherapists = JSON.parse(localStorage.getItem('mindcare_therapists') || '[]');
        const therapistForBooking = {
          id: serviceToApprove.therapistId,
          name: serviceToApprove.therapistName,
          title: serviceToApprove.qualification,
          specialization: serviceToApprove.specialization,
          experience: parseInt(serviceToApprove.experience.split(' ')[0]) || 0,
          rating: 4.8,
          reviewCount: 0,
          hourlyRate: serviceToApprove.chargesPerSession,
          location: 'Online',
          avatar: serviceToApprove.profilePicture || 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150',
          verified: true,
          nextAvailable: 'Today, 2:00 PM',
          bio: serviceToApprove.bio,
          languages: serviceToApprove.languages
        };
        
        const updatedAvailableTherapists = availableTherapists.filter((t: any) => t.id !== serviceToApprove.therapistId);
        updatedAvailableTherapists.push(therapistForBooking);
        localStorage.setItem('mindcare_therapists', JSON.stringify(updatedAvailableTherapists));
        
        // Track the approval in analytics
        trackTherapistApproval(serviceToApprove);
      }
      
      // Update local therapist state
      const updatedTherapists = therapists.map(t => 
        t.id === therapistId ? { ...t, status: 'active' as const, verified: true } : t
      );
      setTherapists(updatedTherapists);
      
    } else if (action === 'suspended') {
      // Update therapist services status
      const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
      const updatedServices = therapistServices.map((s: any) => 
        s.therapistId === therapistId ? { ...s, status: 'suspended' } : s
      );
      localStorage.setItem('mindcare_therapist_services', JSON.stringify(updatedServices));
      
      const updatedTherapists = therapists.map(t => 
        t.id === therapistId ? { ...t, status: 'suspended' as const } : t
      );
      setTherapists(updatedTherapists);
      
      // Update registered users
      const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      const updatedUsers = registeredUsers.map((u: any) => 
        u.id === therapistId ? { ...u, status: 'suspended' } : u
      );
      localStorage.setItem('mindcare_registered_users', JSON.stringify(updatedUsers));
      
      // Remove from available therapists for booking
      const availableTherapists = JSON.parse(localStorage.getItem('mindcare_therapists') || '[]');
      const updatedAvailableTherapists = availableTherapists.filter((t: any) => t.id !== therapistId);
      localStorage.setItem('mindcare_therapists', JSON.stringify(updatedAvailableTherapists));
    } else if (action === 'deleted') {
      // Remove from therapist services
      const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
      const updatedServices = therapistServices.filter((s: any) => s.therapistId !== therapistId);
      localStorage.setItem('mindcare_therapist_services', JSON.stringify(updatedServices));
      
      const updatedTherapists = therapists.filter(t => t.id !== therapistId);
      setTherapists(updatedTherapists);
      
      // Remove from registered users
      const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      const updatedUsers = registeredUsers.filter((u: any) => u.id !== therapistId);
      localStorage.setItem('mindcare_registered_users', JSON.stringify(updatedUsers));
      
      // Remove from available therapists for booking
      const availableTherapists = JSON.parse(localStorage.getItem('mindcare_therapists') || '[]');
      const updatedAvailableTherapists = availableTherapists.filter((t: any) => t.id !== therapistId);
      localStorage.setItem('mindcare_therapists', JSON.stringify(updatedAvailableTherapists));
    } else if (action === 'rejected') {
      // Update therapist services status to rejected
      const therapistServices = JSON.parse(localStorage.getItem('mindcare_therapist_services') || '[]');
      const updatedServices = therapistServices.map((s: any) => 
        s.therapistId === therapistId ? { ...s, status: 'rejected' } : s
      );
      localStorage.setItem('mindcare_therapist_services', JSON.stringify(updatedServices));
      
      // Update registered users
      const registeredUsers = JSON.parse(localStorage.getItem('mindcare_registered_users') || '[]');
      const updatedUsers = registeredUsers.map((u: any) => 
        u.id === therapistId ? { ...u, status: 'rejected' } : u
      );
      localStorage.setItem('mindcare_registered_users', JSON.stringify(updatedUsers));
      
      // Update local therapist state
      const updatedTherapists = therapists.map(t => 
        t.id === therapistId ? { ...t, status: 'inactive' as const, verified: false } : t
      );
      setTherapists(updatedTherapists);
    }
    
    toast.success(`Therapist ${action} successfully`);
  };

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.specialization.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || therapist.status === filterStatus;
    const matchesSpecialization = filterSpecialization === 'all' || 
                                  therapist.specialization.some(s => s.includes(filterSpecialization));
    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  const stats = [
    {
      title: 'Total Therapists',
      value: therapists.length,
      icon: UserCheck,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Active Therapists',
      value: therapists.filter(t => t.status === 'active').length,
      icon: Shield,
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Pending Approval',
      value: therapists.filter(t => t.status === 'pending').length,
      icon: AlertTriangle,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Average Rating',
      value: therapists.length > 0 ? (therapists.reduce((sum, t) => sum + t.rating, 0) / therapists.length).toFixed(1) : '0',
      icon: Star,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const specializations = ['All', 'CBT', 'PTSD', 'Trauma', 'Family Therapy', 'Addiction', 'EMDR', 'Anxiety', 'Depression'];

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50'
    }`}>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Therapist Management
              </h1>
              <p className={`text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Manage therapist accounts, approvals, and performance
              </p>
            </div>
            <button
              onClick={() => setShowTherapistModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add Therapist</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {stat.title}
                  </h3>
                  <p className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mb-4 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search therapists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                {specializations.map(spec => (
                  <option key={spec} value={spec === 'All' ? 'all' : spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Therapists Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTherapists.map((therapist, index) => (
            <motion.div
              key={therapist.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                      {therapist.profilePicture ? (
                        <img
                          src={therapist.profilePicture}
                          alt={therapist.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    {therapist.verified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {therapist.name}
                    </h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {therapist.rating}
                      </span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        ({therapist.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(therapist.status)}`}>
                  {therapist.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <Mail className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {therapist.email}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {therapist.experience}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {therapist.patientsCount} patients
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    ${therapist.hourlyRate}/session
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Specializations:
                </p>
                <div className="flex flex-wrap gap-1">
                  {therapist.specialization.slice(0, 3).map((spec, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                  {therapist.specialization.length > 3 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      +{therapist.specialization.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {therapist.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleTherapistAction(therapist.id, 'approved')}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleTherapistAction(therapist.id, 'rejected')}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {therapist.status === 'active' && (
                    <button
                      onClick={() => handleTherapistAction(therapist.id, 'suspended')}
                      className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Suspend</span>
                    </button>
                  )}
                  {therapist.status === 'suspended' && (
                    <button
                      onClick={() => handleTherapistAction(therapist.id, 'approved')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Reactivate</span>
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedTherapist(therapist);
                      setShowTherapistModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-green-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTherapistAction(therapist.id, 'deleted')}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Therapist Detail Modal */}
        {showTherapistModal && selectedTherapist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTherapistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`max-w-4xl w-full rounded-2xl shadow-2xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Therapist Details
                  </h2>
                  <button
                    onClick={() => setShowTherapistModal(false)}
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    ×
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Name</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.name}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Email</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.email}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Phone</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.phone}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Languages</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.languages.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      Professional Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Qualification</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.qualification || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>License Number</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.licenseNumber}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Experience</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          {selectedTherapist.experience}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Hourly Rate</label>
                        <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                          ${selectedTherapist.hourlyRate}
                        </p>
                      </div>
                      <div>
                        <label className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Rating</label>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {selectedTherapist.rating} ({selectedTherapist.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTherapist.specialization.map((spec, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className={`text-lg font-semibold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Bio
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedTherapist.bio}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TherapistsManagementPage;