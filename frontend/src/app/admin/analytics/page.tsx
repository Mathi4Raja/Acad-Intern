'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Briefcase, Building2, FileText, Calendar, Filter, Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30days');
  const [metricType, setMetricType] = useState('all');

  // Mock analytics data
  const overviewStats = [
    {
      label: 'Total Users',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Total Internships',
      value: '342',
      change: '+8.3%',
      trend: 'up',
      icon: Briefcase,
      color: 'purple'
    },
    {
      label: 'Total Applications',
      value: '2,856',
      change: '+18.7%',
      trend: 'up',
      icon: FileText,
      color: 'green'
    },
    {
      label: 'Active Companies',
      value: '156',
      change: '-2.1%',
      trend: 'down',
      icon: Building2,
      color: 'orange'
    }
  ];

  // User growth data (last 6 months)
  const userGrowthData = [
    { month: 'Jul', students: 120, companies: 18 },
    { month: 'Aug', students: 145, companies: 22 },
    { month: 'Sep', students: 178, companies: 28 },
    { month: 'Oct', students: 210, companies: 35 },
    { month: 'Nov', students: 245, companies: 42 },
    { month: 'Dec', students: 289, companies: 51 }
  ];

  // Internship statistics
  const internshipStats = [
    { label: 'Total Posted', value: 342, percentage: 100, color: 'blue' },
    { label: 'Active', value: 156, percentage: 45.6, color: 'green' },
    { label: 'Completed', value: 98, percentage: 28.7, color: 'purple' },
    { label: 'In Progress', value: 67, percentage: 19.6, color: 'yellow' },
    { label: 'Rejected', value: 21, percentage: 6.1, color: 'red' }
  ];

  // Application funnel
  const applicationFunnel = [
    { stage: 'Total Applications', count: 2856, percentage: 100 },
    { stage: 'Under Review', count: 1428, percentage: 50 },
    { stage: 'Shortlisted', count: 571, percentage: 20 },
    { stage: 'Interview Scheduled', count: 286, percentage: 10 },
    { stage: 'Accepted', count: 143, percentage: 5 }
  ];

  // Top performing companies
  const topCompanies = [
    { name: 'Tech Innovations Ltd', internships: 45, applications: 567, hiringRate: 12.5 },
    { name: 'Digital Solutions Pvt Ltd', internships: 38, applications: 489, hiringRate: 10.2 },
    { name: 'Future Systems', internships: 32, applications: 412, hiringRate: 9.8 },
    { name: 'Global Tech Corp', internships: 28, applications: 378, hiringRate: 8.9 },
    { name: 'Innovation Hub', internships: 24, applications: 298, hiringRate: 7.4 }
  ];

  // Popular skills
  const popularSkills = [
    { skill: 'React.js', count: 234, percentage: 82 },
    { skill: 'Python', count: 198, percentage: 69 },
    { skill: 'Node.js', count: 176, percentage: 62 },
    { skill: 'Data Analysis', count: 167, percentage: 58 },
    { skill: 'UI/UX Design', count: 145, percentage: 51 },
    { skill: 'Machine Learning', count: 132, percentage: 46 },
    { skill: 'Java', count: 128, percentage: 45 },
    { skill: 'MongoDB', count: 112, percentage: 39 }
  ];

  // Activity by day of week
  const activityByDay = [
    { day: 'Mon', applications: 420, internships: 48 },
    { day: 'Tue', applications: 456, internships: 52 },
    { day: 'Wed', applications: 489, internships: 58 },
    { day: 'Thu', applications: 512, internships: 61 },
    { day: 'Fri', applications: 445, internships: 55 },
    { day: 'Sat', applications: 278, internships: 32 },
    { day: 'Sun', applications: 256, internships: 36 }
  ];

  // Geographic distribution
  const geographicData = [
    { location: 'Mumbai', users: 342, percentage: 27.4 },
    { location: 'Delhi', users: 298, percentage: 23.9 },
    { location: 'Bangalore', users: 267, percentage: 21.4 },
    { location: 'Pune', users: 156, percentage: 12.5 },
    { location: 'Hyderabad', users: 134, percentage: 10.7 },
    { location: 'Others', users: 50, percentage: 4.1 }
  ];

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  const getBgColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-50',
      purple: 'bg-purple-50',
      green: 'bg-green-50',
      yellow: 'bg-yellow-50',
      red: 'bg-red-50',
      orange: 'bg-orange-50'
    };
    return colors[color] || 'bg-gray-50';
  };

  const getTextColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      orange: 'text-orange-600'
    };
    return colors[color] || 'text-gray-600';
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
              <BarChart3 className="text-red-600" size={18} />
              Analytics & Insights
            </h1>
            <p className="text-xs text-gray-600">Platform performance and trends</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>

            {/* Export Button */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium">
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        {overviewStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <div className="flex items-start justify-between mb-1">
              <div className={`p-1.5 rounded-lg ${getBgColorClass(stat.color)}`}>
                <stat.icon className={getTextColorClass(stat.color)} size={14} />
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="hidden sm:inline">{stat.change}</span>
              </div>
            </div>
            <div className="mt-1">
              <div className="text-[10px] text-gray-600 mb-0.5">{stat.label}</div>
              <div className="text-base sm:text-xl font-bold text-gray-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">User Growth Trend</h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Students</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-purple-500 rounded"></div>
              <span className="text-gray-600">Companies</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48">
          {userGrowthData.map((data, index) => {
            const maxValue = Math.max(...userGrowthData.map(d => d.students));
            const studentHeight = (data.students / maxValue) * 100;
            const companyHeight = (data.companies / (maxValue / 10)) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 flex-1">
                  <div className="relative group flex-1 max-w-[30px] sm:max-w-[40px]">
                    <div
                      className="bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
                      style={{ height: `${studentHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {data.students}
                      </div>
                    </div>
                  </div>
                  <div className="relative group flex-1 max-w-[30px] sm:max-w-[40px]">
                    <div
                      className="bg-purple-500 rounded-t hover:bg-purple-600 transition-all cursor-pointer"
                      style={{ height: `${companyHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {data.companies}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-600">{data.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Internship Statistics & Application Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Internship Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Internship Statistics</h2>
          <div className="space-y-2.5">
            {internshipStats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{stat.label}</span>
                  <span className="text-xs font-bold text-gray-900">
                    {stat.value} <span className="text-gray-500">({stat.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 sm:h-3 rounded-full ${getColorClass(stat.color)} transition-all`}
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Funnel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Application Funnel</h2>
          <div className="space-y-3">
            {applicationFunnel.map((stage, index) => (
              <div key={index} className="relative">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg p-2.5 transition-all hover:shadow-md"
                  style={{ 
                    width: '100%',
                    maxWidth: `${Math.max(stage.percentage, 50)}%`,
                    minWidth: '280px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto pl-3">
                      <span className="text-sm sm:text-base lg:text-lg font-bold">{stage.count}</span>
                      <span className="text-[10px] sm:text-xs font-medium opacity-90">({stage.percentage}%)</span>
                    </div>
                  </div>
                </div>
                {index < applicationFunnel.length - 1 && (
                  <div className="mt-1 ml-4 text-[10px] sm:text-xs text-gray-500">
                    ↓ {((applicationFunnel[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Companies */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Top Performing Companies</h2>
        <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
          <table className="w-full min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 text-[10px] font-semibold text-gray-700">Rank</th>
                <th className="text-left py-2 px-2 text-[10px] font-semibold text-gray-700">Company Name</th>
                <th className="text-left py-2 px-2 text-[10px] font-semibold text-gray-700">Internships</th>
                <th className="text-left py-2 px-2 text-[10px] font-semibold text-gray-700">Applications</th>
                <th className="text-left py-2 px-2 text-[10px] font-semibold text-gray-700">Hiring Rate</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((company, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-2 px-2 font-medium text-gray-900 text-xs">{company.name}</td>
                  <td className="py-2 px-2 text-gray-600 text-xs">{company.internships}</td>
                  <td className="py-2 px-2 text-gray-600 text-xs">{company.applications}</td>
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs sm:text-sm">
                      {company.hiringRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popular Skills & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Popular Skills */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Most In-Demand Skills</h2>
          <div className="space-y-2.5">
            {popularSkills.map((skill, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{skill.skill}</span>
                  <span className="text-[10px] text-gray-600">{skill.count} internships</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                    style={{ width: `${skill.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Geographic Distribution</h2>
          <div className="space-y-2.5">
            {geographicData.map((location, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{location.location}</span>
                    <span className="text-xs font-bold text-gray-900">
                      {location.users} <span className="text-gray-500 font-normal">({location.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 sm:h-3 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity by Day of Week */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Activity by Day of Week</h2>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded"></div>
              <span className="text-gray-600">Applications</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-purple-500 rounded"></div>
              <span className="text-gray-600">Internships</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-40 sm:h-48">
          {activityByDay.map((data, index) => {
            const maxApplications = Math.max(...activityByDay.map(d => d.applications));
            const maxInternships = Math.max(...activityByDay.map(d => d.internships));
            const applicationHeight = (data.applications / maxApplications) * 100;
            const internshipHeight = (data.internships / maxInternships) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 sm:gap-2">
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 flex-1">
                  <div className="relative group flex-1 max-w-[30px] sm:max-w-[40px]">
                    <div
                      className="bg-green-500 rounded-t hover:bg-green-600 transition-all cursor-pointer"
                      style={{ height: `${applicationHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {data.applications}
                      </div>
                    </div>
                  </div>
                  <div className="relative group flex-1 max-w-[30px] sm:max-w-[40px]">
                    <div
                      className="bg-purple-500 rounded-t hover:bg-purple-600 transition-all cursor-pointer"
                      style={{ height: `${internshipHeight}%` }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {data.internships}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-gray-600">{data.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-2.5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2.5 flex items-center gap-2">
          <TrendingUp className="text-red-600" size={16} />
          Key Insights
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">Peak Activity Day</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">Thursday</div>
            <div className="text-[10px] text-green-600 mt-0.5">512 applications</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">Most Popular</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">Mumbai</div>
            <div className="text-[10px] text-blue-600 mt-0.5">27.4% users</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">Top Skill</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">React.js</div>
            <div className="text-[10px] text-purple-600 mt-0.5">82% internships</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">Avg Hiring Rate</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">9.8%</div>
            <div className="text-[10px] text-orange-600 mt-0.5">Top 5 companies</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">Success Rate</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">5%</div>
            <div className="text-[10px] text-red-600 mt-0.5">143 of 2,856</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <div className="text-[10px] text-gray-600 mb-0.5">User Growth</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">+12.5%</div>
            <div className="text-[10px] text-green-600 mt-0.5">156 new users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
