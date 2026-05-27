import React, { useState, useEffect } from 'react';

const ProgressMilestoneData = ({ ponumber }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [formData, setFormData] = useState({
    mfgstart: '',
    Bldate: '',
    Fatdate: '',
    Fatreportdate: '',
    vesselreacheddate: '',
    customscleareddate: ''
  });

  // Helper function to format date for input field
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await fetch(`/api/poschedule/progress?ponumber=${ponumber}`);
        const data = await response.json();
        
        if (data.success && data.progressdata) {
          const formattedData = Object.entries(data.progressdata).reduce((acc, [key, value]) => {
            if (value) {
              acc[key] = formatDateForInput(value);
            }
            return acc;
          }, {});
          
          setFormData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (ponumber) {
      fetchProgressData();
    }
  }, [ponumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = new Date(value).toISOString();
        }
        return acc;
      }, {});

      const response = await fetch('/api/poschedule/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ponumber,
          progressdata: formattedData
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Progress data saved successfully!');
      } else {
        alert('Error saving progress data');
      }
    } catch (error) {
      console.error('Error saving progress data:', error);
      alert('Error saving progress data');
    }
  };

  const formFields = [
    { name: 'mfgstart', label: 'Manufacturing Start Date', type: 'date' },
    { name: 'Bldate', label: 'BL Date', type: 'date' },
    { name: 'Fatdate', label: 'FAT Date', type: 'date' },
    { name: 'Fatreportdate', label: 'FAT Report Date', type: 'date' },
    { name: 'vesselreacheddate', label: 'Vessel Reached Date', type: 'date' },
    { name: 'customscleareddate', label: 'Customs Cleared Date', type: 'date' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex">
      {/* Vertical Title Band */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-emerald-600 text-white px-2 py-4 rounded-l-lg cursor-pointer hover:bg-emerald-700 transition-colors duration-150 flex items-center"
      >
        <div className="transform -rotate-180 whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
          <span className="text-lg font-extrabold tracking-wider">
            PROGRESS MILESTONE DATA
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 flex justify-end cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors duration-150"
        >
          <svg 
            className={`w-6 h-6 text-gray-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {formFields.map((field, index) => (
                    <div 
                      key={field.name} 
                      className={`
                        relative p-4 bg-emerald-50/50 dark:bg-gray-800/50 
                        rounded-lg border border-emerald-100 dark:border-gray-700
                        hover:shadow-md transition-shadow duration-200
                        ${field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3 xl:col-span-4' : ''}
                        ${index % 2 === 0 ? 'bg-emerald-50/30' : 'bg-emerald-50/60'}
                      `}
                    >
                      <label 
                        htmlFor={field.name}
                        className="block text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-2"
                      >
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          id={field.name}
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className={`block w-full px-3 py-2 rounded-md 
                                   border border-emerald-200 dark:border-gray-600
                                   shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                                   bg-white dark:bg-gray-700 
                                   ${formData[field.name] 
                                     ? 'text-emerald-900 font-semibold dark:text-emerald-300' 
                                     : 'text-gray-500 dark:text-gray-400'}`}
                        />
                        {field.type === 'date' && (
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg 
                              className={`h-5 w-5 ${formData[field.name] ? 'text-emerald-600' : 'text-gray-400'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-emerald-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent 
                               shadow-sm text-sm font-medium rounded-md text-white 
                               bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressMilestoneData; 