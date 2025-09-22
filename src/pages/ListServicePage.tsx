import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ServiceListing {
  id: string;
  therapistId: string;
  name: string;
  email: string;
  phone: string;
  hourlyRate: number;
  bio: string;
  specializations: string[];
  experience: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const ListServicePage: React.FC = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [serviceListing, setServiceListing] = useState<ServiceListing | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hourlyRate: '',
    bio: '',
    specializations: [] as string[],
    experience: ''
  });

  const availableSpecializations = [
    'CBT', 'Anxiety', 'Depression', 'PTSD', 'Addiction', 'Couples Therapy',
    'Family Therapy', 'Child Psychology', 'Trauma', 'Mindfulness', 'General Therapy'
  ];

  useEffect(() => {
    loadServiceListing();
  }, [user]);

  const loadServiceListing = () => {
    if (!user) return;
    
    const therapistServices = JSON.parse(localStorage.getItem('therapistServices') || '[]');
    const userService = therapistServices.find((service: ServiceListing) => service.therapistId === user.id);
    
    if (userService) {
      setServiceListing(userService);
      setFormData({
        name: userService.name,
        email: userService.email,
        phone: userService.phone,
        hourlyRate: userService.hourlyRate.toString(),
        bio: userService.bio,
        specializations: userService.specializations,
        experience: userService.experience.toString()
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newService: ServiceListing = {
      id: serviceListing?.id || Date.now().toString(),
      therapistId: user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      hourlyRate: parseFloat(formData.hourlyRate),
      bio: formData.bio,
      specializations: formData.specializations,
      experience: parseInt(formData.experience),
      status: serviceListing?.status === 'approved' ? 'approved' : 'pending',
      submittedAt: serviceListing?.submittedAt || new Date().toISOString()
    };

    const therapistServices = JSON.parse(localStorage.getItem('therapistServices') || '[]');
    const updatedServices = serviceListing
      ? therapistServices.map((service: ServiceListing) => 
          service.therapistId === user.id ? newService : service
        )
      : [...therapistServices, newService];

    localStorage.setItem('therapistServices', JSON.stringify(updatedServices));
    
    // Update user status
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, status: newService.status } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    setServiceListing(newService);
    setIsEditing(false);
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!user || !serviceListing) return;
    
    if (window.confirm('Are you sure you want to delete your service listing? This action cannot be undone.')) {
      // Remove from therapist services
      const therapistServices = JSON.parse(localStorage.getItem('therapistServices') || '[]');
      const updatedServices = therapistServices.filter((service: ServiceListing) => service.therapistId !== user.id);
      localStorage.setItem('therapistServices', JSON.stringify(updatedServices));
      
      // Remove from available therapists
      const availableTherapists = JSON.parse(localStorage.getItem('availableTherapists') || '[]');
      const updatedAvailable = availableTherapists.filter((therapist: any) => therapist.id !== user.id);
      localStorage.setItem('availableTherapists', JSON.stringify(updatedAvailable));
      
      // Update user status
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => 
        u.id === user.id ? { ...u, status: 'pending' } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setServiceListing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        hourlyRate: '',
        bio: '',
        specializations: [],
        experience: ''
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            List Your Service
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create or manage your therapy service listing
          </p>
        </motion.div>

        {serviceListing && !isEditing && !showForm ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-6`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {serviceListing.name}
                </h2>
                <div className={`flex items-center gap-2 ${getStatusColor(serviceListing.status)}`}>
                  {getStatusIcon(serviceListing.status)}
                  <span className="font-medium capitalize">{serviceListing.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {serviceListing.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {serviceListing.phone}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    ${serviceListing.hourlyRate}/session
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {serviceListing.experience} years experience
                  </span>
                </div>
              </div>
              
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Specializations
                </h3>
                <div className="flex flex-wrap gap-2">
                  {serviceListing.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Bio
              </h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {serviceListing.bio}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
          >
            {!serviceListing && !showForm ? (
              <div className="text-center py-12">
                <User className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No Service Listed
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                  Create your first service listing to start accepting patients
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Service Listing
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isEditing ? 'Edit Service' : 'Create Service Listing'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowForm(false);
                      if (serviceListing) loadServiceListing();
                    }}
                    className={`px-4 py-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Specializations
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSpecializations.map((spec) => (
                      <label
                        key={spec}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.specializations.includes(spec)
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                          className="rounded"
                        />
                        <span className="text-sm">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Tell patients about your background, approach, and expertise..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {isEditing ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ListServicePage;