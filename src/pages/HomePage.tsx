import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Users, Award, ArrowRight, Star, Clock, Building, Code, Brain, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../context/SecureAuthContext';
import FeaturedHiringsCarousel from '../components/FeaturedHiringsCarousel';

const HomePage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentUpdates, setRecentUpdates] = useState([
    {
      id: '1',
      company: 'Tech Mahindra',
      update: 'Added 15 new coding questions for 2024 pattern',
      time: '2 hours ago',
      type: 'hiring'
    },
    {
      id: '2',
      company: 'TCS',
      update: 'Updated aptitude questions for latest pattern',
      time: '5 hours ago',
      type: 'pattern'
    },
    {
      id: '3',
      company: 'Wipro',
      update: 'New interview questions added for Project Engineer',
      time: '1 day ago',
      type: 'deadline'
    }
  ]);
  
  // Admin form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    company: '',
    update: '',
    time: '',
    type: 'hiring'
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/questions?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  const featuredCompanies = [
    {
    name: 'Tech Mahindra',
    logo: 'https://imgs.search.brave.com/UUQdyjtxxqOrVnredaWkOXDfQB03AOdzQSio8BIpO0o/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sb2dv/d2lrLmNvbS9jb250/ZW50L3VwbG9hZHMv/aW1hZ2VzL3RlY2gt/bWFoaW5kcmEtbmV3/NjIzNS5sb2dvd2lr/LmNvbS53ZWJw',
    openings: 60,
    category: 'IT Services & Consulting',
    fallback: 'https://via.placeholder.com/200x200/FF4F00/FFFFFF?text=TechM'
  },
  {
    name: 'Capital One',
    logo: 'https://imgs.search.brave.com/nr10loBTH_lzd2wQqDmv8XBgScbjkDBO-JF4X6K77Rc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9mYWJy/aWticmFuZHMuY29t/L3dwLWNvbnRlbnQv/dXBsb2Fkcy9DYXBp/dGFsLW9uZS1Mb2dv/LTEtMTE1NXg3NzAu/cG5n',
    openings: 35,
    category: 'Financial Services & Technology',
    fallback: 'https://via.placeholder.com/200x200/D41E2A/FFFFFF?text=Cap1'
  },
  {
    name: 'UBS',
    logo: 'https://www.ubs.com/etc/designs/fit/img/UBS_Logo_Semibold.svg',
    openings: 109,
    category: 'Investment Banking & Financial Services',
    fallback: 'https://via.placeholder.com/200x200/D90A2C/FFFFFF?text=UBS'
  },
    { 
      name: 'Wipro', 
      logo: 'https://imgs.search.brave.com/nSe7yrg37Wor0M7HAzRHz9yLcqi5WMtgi-jTkBAvGSI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9sb2dv/cy13b3JsZC5uZXQv/d3AtY29udGVudC91/cGxvYWRzLzIwMjMv/MDEvV2lwcm8tTG9n/by01MDB4MjgxLmpw/Zw', 
      openings: 800, 
      category: 'Technology',
      fallback: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=WIPRO'
    },
    { 
      name: 'Infosys', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', 
      openings: 950, 
      category: 'Consulting',
      fallback: 'https://via.placeholder.com/200x200/007CC3/FFFFFF?text=INFOSYS'
    },
    { 
      name: 'Accenture', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg', 
      openings: 600, 
      category: 'Global Services',
      fallback: 'https://via.placeholder.com/200x200/A100FF/FFFFFF?text=ACCENTURE'
    },
    { 
      name: 'Cognizant', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Cognizant_logo_2022.svg', 
      openings: 750, 
      category: 'Digital Solutions',
      fallback: 'https://via.placeholder.com/200x200/0066CC/FFFFFF?text=COGNIZANT'
    },
    { 
      name: 'HCLTech', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/00/HCLTech_logo_2022.svg', 
      openings: 500, 
      category: 'Innovation',
      fallback: 'https://via.placeholder.com/200x200/FF0000/FFFFFF?text=HCLTECH'
    },
    { 
      name: 'Tech Mahindra', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Tech_Mahindra_New_Logo.svg/1280px-Tech_Mahindra_New_Logo.svg.png', 
      openings: 650, 
      category: 'Digital Transformation',
      fallback: 'https://via.placeholder.com/200x200/C41E3A/FFFFFF?text=TECH+MAHINDRA'
    },
    { 
      name: 'Capgemini', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Capgemini_logo_2017.svg', 
      openings: 450, 
      category: 'Consulting',
      fallback: 'https://via.placeholder.com/200x200/0070AD/FFFFFF?text=CAPGEMINI'
    },
    { 
      name: 'IBM', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', 
      openings: 380, 
      category: 'Cloud & AI',
      fallback: 'https://via.placeholder.com/200x200/1F70C1/FFFFFF?text=IBM'
    },
    { 
      name: 'LTIMindtree', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/LTIMindtree_logo.svg/2560px-LTIMindtree_logo.svg.png', 
      openings: 420, 
      category: 'Digital Solutions',
      fallback: 'https://via.placeholder.com/200x200/00BCF2/FFFFFF?text=LTIMINDTREE'
    },
    { 
      name: 'Mphasis', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Mphasis_logo_blue.svg/1280px-Mphasis_logo_blue.svg.png', 
      openings: 320, 
      category: 'IT Services',
      fallback: 'https://via.placeholder.com/200x200/FF9900/FFFFFF?text=MPHASIS'
    },
    { 
      name: 'Oracle', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', 
      openings: 250, 
      category: 'Database & Cloud',
      fallback: 'https://via.placeholder.com/200x200/4285F4/FFFFFF?text=ORACLE'
    },
    { 
      name: 'Persistent Systems', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Persistent_Systems_logo.svg/2560px-Persistent_Systems_logo.svg.png', 
      openings: 280, 
      category: 'Software Solutions',
      fallback: 'https://via.placeholder.com/200x200/00A651/FFFFFF?text=PERSISTENT'
    },
    { 
      name: 'Coforge', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Coforge_logo.svg/1280px-Coforge_logo.svg.png', 
      openings: 200, 
      category: 'Digital Services',
      fallback: 'https://via.placeholder.com/200x200/E31837/FFFFFF?text=COFORGE'
    },
    { 
      name: 'Cyient', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Cyient_logo.svg/1280px-Cyient_logo.svg.png', 
      openings: 180, 
      category: 'Engineering Services',
      fallback: 'https://via.placeholder.com/200x200/0066CC/FFFFFF?text=CYIENT'
    },
    { 
      name: 'Zensar Technologies', 
      logo: 'https://upload.wikimedia.org/wikipedia/en/c/c4/Zensar_Technologies_logo.svg', 
      openings: 160, 
      category: 'Digital Solutions',
      fallback: 'https://via.placeholder.com/200x200/FF6B35/FFFFFF?text=ZENSAR'
    },
    { 
      name: 'Happiest Minds', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Happiest_Minds_Logo.svg/1280px-Happiest_Minds_Logo.svg.png', 
      openings: 140, 
      category: 'Digital Transformation',
      fallback: 'https://via.placeholder.com/200x200/FF4081/FFFFFF?text=HAPPIEST+MINDS'
    },
    { 
      name: 'Birlasoft', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Birlasoft_Logo.svg/1280px-Birlasoft_Logo.svg.png', 
      openings: 120, 
      category: 'Enterprise Solutions',
      fallback: 'https://via.placeholder.com/200x200/9C27B0/FFFFFF?text=BIRLASOFT'
    },
    { 
      name: 'KPIT Technologies', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/KPIT_Technologies_logo.svg/1280px-KPIT_Technologies_logo.svg.png', 
      openings: 100, 
      category: 'Automotive Tech',
      fallback: 'https://via.placeholder.com/200x200/FF5722/FFFFFF?text=KPIT'
    },
    { 
      name: 'Tata Elxsi', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Tata_Elxsi_Logo.svg/1280px-Tata_Elxsi_Logo.svg.png', 
      openings: 90, 
      category: 'Design & Technology',
      fallback: 'https://via.placeholder.com/200x200/607D8B/FFFFFF?text=TATA+ELXSI'
    }
  ];

  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const displayedCompanies = showAllCompanies ? featuredCompanies : featuredCompanies.slice(0, 6);

  const quickStats = [
    { label: 'Active Companies', value: '50+', icon: Building, color: 'bg-blue-500' },
    { label: 'Live Openings', value: '5000+', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Success Stories', value: '10K+', icon: Users, color: 'bg-purple-500' },
    { label: 'Practice Questions', value: '2500+', icon: Star, color: 'bg-orange-500' }
  ];

  // Admin functions
  const resetForm = () => {
    setUpdateForm({
      company: '',
      update: '',
      time: '',
      type: 'hiring'
    });
    setEditingUpdate(null);
  };

  const handleAddUpdate = () => {
    const newUpdate = {
      id: Date.now().toString(),
      ...updateForm,
      time: updateForm.time || 'Just now'
    };
    setRecentUpdates([newUpdate, ...recentUpdates]);
    resetForm();
    setShowAddForm(false);
  };

  const handleEditUpdate = (update: any) => {
    setUpdateForm({
      company: update.company,
      update: update.update,
      time: update.time,
      type: update.type
    });
    setEditingUpdate(update);
    setShowAddForm(true);
  };

  const handleUpdateUpdate = () => {
    setRecentUpdates(recentUpdates.map(update => 
      update.id === editingUpdate.id 
        ? { ...update, ...updateForm }
        : update
    ));
    resetForm();
    setShowAddForm(false);
  };

  const handleDeleteUpdate = (id: string) => {
    if (confirm('Are you sure you want to delete this update?')) {
      setRecentUpdates(recentUpdates.filter(update => update.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar Section */}
        <div className="py-8">
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search companies, roles, exam patterns, or practice questions..."
                className="w-full pl-16 pr-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-lg bg-white transition-all duration-300"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center min-w-[40px] sm:min-w-auto"
              >
                <Search className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Featured Hirings Carousel */}
        <div className="mb-8">
          <FeaturedHiringsCarousel />
        </div>

        {/* Main Content Grid */}
        <div className="space-y-6 mb-12">

          {/* Top Hiring Companies - Full Width */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Building className="h-6 w-6 mr-2 text-blue-600" />
                Practice by Company
              </h2>
              <button
                onClick={() => setShowAllCompanies(!showAllCompanies)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-medium flex items-center space-x-2 transform hover:scale-105 shadow-lg"
              >
                <span>{showAllCompanies ? 'Show Less' : 'View All Companies'}</span>
                <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${showAllCompanies ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {displayedCompanies.map((company, index) => (
                <Link
                  key={index}
                  to={`/practice?company=${encodeURIComponent(company.name)}`}
                  className="relative p-3 sm:p-4 bg-white rounded-xl hover:shadow-xl transition-all duration-300 group border border-gray-200 hover:border-blue-300 transform hover:scale-105 overflow-hidden"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="text-center relative">
                    {/* Company Logo */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      <img 
                        src={company.logo} 
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain bg-white p-1 group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = company.fallback;
                        }}
                      />
                    </div>
                    
                    {/* Company Name */}
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                      {company.name}
                    </h3>
                    
                    {/* Questions Count */}
                    <p className="text-xs text-gray-500 mb-2">
                      {company.openings} questions
                    </p>
                    
                    {/* Category Badge */}
                    <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium">
                      {company.category}
                    </span>
                    
                    {/* Practice Button */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span
                        className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-medium shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                      >
                        <Code className="h-3 w-3 mr-1" />
                        Practice Now
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Show more companies message */}
            {!showAllCompanies && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm mb-3">
                  Showing 6 of {featuredCompanies.length} companies
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowAllCompanies(true)}
                    className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 text-sm font-medium flex items-center space-x-2 border border-gray-300"
                  >
                    <span>View {featuredCompanies.length - 6} More Companies</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Updates */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-blue-600" />
                Latest Question Updates
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm font-medium flex items-center space-x-2 transform hover:scale-105 shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Update</span>
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <div key={update.id} className="p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      update.type === 'hiring' ? 'bg-blue-100' :
                      update.type === 'pattern' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      {update.type === 'hiring' ? (
                        <Code className="h-4 w-4 text-blue-600" />
                      ) : update.type === 'pattern' ? (
                        <Brain className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{update.company}</h4>
                      <p className="text-sm text-gray-600 mt-1">{update.update}</p>
                      <p className="text-xs text-gray-400 mt-2">{update.time}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditUpdate(update)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit update"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete update"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Study Tip</h3>
              </div>
              <p className="text-sm text-purple-700">
                Practice questions daily and focus on understanding the solution approach rather than memorizing answers!
              </p>
            </div>
          </div>
        </div>

        {/* Admin Add/Edit Update Modal */}
        {isAdmin && showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUpdate ? 'Edit Update' : 'Add New Update'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={updateForm.company}
                    onChange={(e) => setUpdateForm({...updateForm, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Tech Mahindra"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Description
                  </label>
                  <textarea
                    value={updateForm.update}
                    onChange={(e) => setUpdateForm({...updateForm, update: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., Added 15 new coding questions for 2024 pattern"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="text"
                    value={updateForm.time}
                    onChange={(e) => setUpdateForm({...updateForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 2 hours ago, Just now"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Type
                  </label>
                  <select
                    value={updateForm.type}
                    onChange={(e) => setUpdateForm({...updateForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hiring">Hiring Update</option>
                    <option value="pattern">Pattern Update</option>
                    <option value="deadline">Deadline Update</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingUpdate ? handleUpdateUpdate : handleAddUpdate}
                  disabled={!updateForm.company || !updateForm.update}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingUpdate ? 'Update' : 'Add'} Update</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Section */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-center text-white mb-12 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6">
              Join thousands of successful candidates who prepared with PrimoJobs
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/signup"
                className="bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors font-semibold inline-flex items-center justify-center"
              >
                Start Your Journey Today
              </Link>
              <Link
                to="/practice"
                className="bg-blue-500 bg-opacity-30 text-white px-6 sm:px-8 py-3 rounded-xl hover:bg-opacity-40 transition-colors font-semibold inline-flex items-center justify-center border border-white border-opacity-30"
              >
                Browse Practice Questions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;