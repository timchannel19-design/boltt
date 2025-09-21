import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Calendar,
  Download, Filter, Eye, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell,
  RadialBarChart, RadialBar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getAnalytics, updateAnalyticsFromCurrentData, generateTimeSeriesData
} from '../utils/analyticsManager';

function AnalyticsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  useEffect(() => {
    // Load initial analytics data
    const initialAnalytics = updateAnalyticsFromCurrentData();
    setAnalytics(initialAnalytics);
    
    // Generate time series data
    const timeData = generateTimeSeriesData();
    setTimeSeriesData(timeData);
    
    // Set up interval to refresh data
    const interval = setInterval(() => {
      const updatedAnalytics = updateAnalyticsFromCurrentData();
      setAnalytics(updatedAnalytics);
      setTimeSeriesData(generateTimeSeriesData());
    }, 10000); // Update every 10 seconds
    
    // Listen for analytics updates
    const handleAnalyticsUpdate = () => {
      const updatedAnalytics = updateAnalyticsFromCurrentData();
      setAnalytics(updatedAnalytics);
      setTimeSeriesData(generateTimeSeriesData());
    };
    
    window.addEventListener('mindcare-analytics-updated', handleAnalyticsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mindcare-analytics-updated', handleAnalyticsUpdate);
    };
  }, []);

  const userTypeDistribution = [
    { name: 'Patients', value: analytics?.users.totalUsers - analytics?.therapists.totalTherapists || 0, color: '#3B82F6' },
    { name: 'Therapists', value: analytics?.therapists.totalTherapists || 0, color: '#10B981' },
    { name: 'Admins', value: 5, color: '#8B5CF6' }
  ];

  const sessionTypeData = [
    { type: 'Video Sessions', count: analytics?.sessions.totalSessions * 0.65 || 0, percentage: 65 },
    { type: 'Phone Sessions', count: analytics?.sessions.totalSessions * 0.22 || 0, percentage: 22 },
    { type: 'In-Person', count: analytics?.sessions.totalSessions * 0.13 || 0, percentage: 13 }
  ];

  // Generate top therapists from real data
  const getTopTherapists = () => {
    const bookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
    const therapistStats: any = {};
    
    bookings.forEach((booking: any) => {
      if (booking.status === 'completed') {
        const therapistName = booking.therapistName;
        if (!therapistStats[therapistName]) {
          therapistStats[therapistName] = {
            name: therapistName,
            sessions: 0,
            rating: 4.8,
            revenue: 0
          };
        }
        therapistStats[therapistName].sessions += 1;
        therapistStats[therapistName].revenue += parseFloat(booking.amount?.replace('$', '') || '0');
      }
    });
    
    return Object.values(therapistStats)
      .sort((a: any, b: any) => b.sessions - a.sessions)
      .slice(0, 5);
  };
  
  const topTherapists = getTopTherapists();

  const stats = analytics ? [
    {
      title: 'Total Users',
      value: analytics.users.totalUsers.toLocaleString(),
      change: `+${analytics.users.userGrowthRate}%`,
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Monthly Revenue',
      value: `$${analytics.revenue.monthlyRevenue.toLocaleString()}`,
      change: `+${analytics.revenue.revenueGrowthRate}%`,
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Active Sessions',
      value: analytics.sessions.activeSessions.toString(),
      change: `+${analytics.sessions.sessionCompletionRate.toFixed(1)}%`,
      trend: 'up',
      icon: Activity,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Total Sessions',
      value: analytics.sessions.totalSessions.toString(),
      change: `${analytics.sessions.completedSessions} completed`,
      trend: 'up',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500'
    }
  ] : [];

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
                Platform Analytics
              </h1>
              <p className={`text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Comprehensive insights into platform performance and user behavior
              </p>
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-2">
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
              <div className="flex items-center space-x-1">
                {stat.trend === 'up' ? (
                  <ArrowUp className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change}
                </span>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  vs last month
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* User Growth Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              User Growth Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeSeriesData.slice(-6).map((data, index) => ({
                month: new Date(data.date).toLocaleDateString('en-US', { month: 'short' }),
                users: data.users,
                sessions: data.sessions
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Revenue Analytics
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeSeriesData.slice(-6).map((data, index) => ({
                month: new Date(data.date).toLocaleDateString('en-US', { month: 'short' }),
                revenue: data.revenue
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="month" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* User Distribution and Session Types */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* User Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              User Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={userTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Session Types */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Session Types Distribution
            </h3>
            <div className="space-y-4">
              {sessionTypeData.map((session, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500`}></div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`w-32 h-2 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${session.percentage}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {session.count} ({session.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Therapists Performance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className={`p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Top Performing Therapists
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Therapist
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sessions
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Rating
                  </th>
                  <th className={`px-4 py-3 text-left text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topTherapists.map((therapist, index) => (
                  <tr key={index} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
                    <td className={`px-4 py-3 font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {therapist.name}
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {therapist.sessions}
                    </td>
                    <td className={`px-4 py-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center space-x-1">
                        <span>{therapist.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(therapist.rating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 font-medium text-green-600`}>
                      ${therapist.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AnalyticsPage;