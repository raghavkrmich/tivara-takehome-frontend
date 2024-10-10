import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Code {
  id: string;
  value: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  procedureCodes: Code[];
  diagnosisCodes: Code[];
}

interface RelevantCode {
  id: string;
  reason: string;
  annotation: string; 
  metadata: {
    description: string; // Make sure to include 'description' in the interface
  };
}

export const UserForm: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation();
  const { 
      firstName = '', 
      lastName = '', 
      dateOfBirth = '', 
      relevantDiagnosis = [] as RelevantCode[], // Extract relevantDiagnosis
      relevantProcedure = [] as RelevantCode[],// Extract relevantProcedure
      excelUsed = false
  } = location.state || {};

  // Redirect if the form is accessed without a prior PDF upload
  const [excelPopupVisible, setExcelPopupVisible] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<RelevantCode | null>(null); // State for selected code details
  const [error, setError] = useState<string | null>(null); // State to handle error messages
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [popupVisible, setPopupVisible] = useState<boolean>(false); // State for pop-up visibility

  useEffect(() => {
    const pdfUploaded = sessionStorage.getItem('pdfUploaded');
    if (pdfUploaded !== 'true') {
      navigate('/'); // Redirect if no PDF uploaded
    }

    if (excelUsed) {
      setExcelPopupVisible(true);
    }

    for (let i = 0; i < relevantDiagnosis.length; i++) {
      setSelectedCode(relevantDiagnosis[i]);
    }
    for (let i = 0; i < relevantDiagnosis.length; i++) {
      setSelectedCode(relevantDiagnosis[i]);
    }

  }, [navigate, excelUsed, relevantDiagnosis, relevantProcedure]);

  const initialFormState: FormData = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    procedureCodes: [],
    diagnosisCodes: [],
  };

  // Map relevantDiagnosis and relevantProcedure to populate form fields
  const preloadedDiagnosisCodes = relevantDiagnosis.map((code: RelevantCode) => ({
    id: code.id,
    value: code.id,
    reason: code.reason,
    annotation: code.annotation
  }));

  const preloadedProcedureCodes = relevantProcedure.map((code: RelevantCode) => ({
    id: code.id,
    value: code.id,
    reason: code.reason,
    annotation: code.annotation
  }));

  const [formData, setFormData] = useState<FormData>({
    ...initialFormState,
    firstName,
    lastName,
    dateOfBirth,
    procedureCodes: preloadedProcedureCodes,
    diagnosisCodes: preloadedDiagnosisCodes
  });

  const handleCodeSelect = (code: RelevantCode) => {
    setSelectedCode(code);
  };

  const closeDetailsBox = () => {
    setSelectedCode(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.procedureCodes.length === 0 || formData.diagnosisCodes.length === 0) {
      setError('Please provide at least one procedure code and one diagnosis code.');
      return;
    }

    const hasEmptyProcedureCode = formData.procedureCodes.some(code => code.value.trim() === '');
    const hasEmptyDiagnosisCode = formData.diagnosisCodes.some(code => code.value.trim() === '');

    if (hasEmptyProcedureCode || hasEmptyDiagnosisCode) {
      setError('Please ensure all procedure and diagnosis codes are filled out.');
      return;
    }

    const invalidProcedureCodes = formData.procedureCodes.filter(code => {
      return code.value.length !== 5 || (code.value.match(/\d/g) || []).length < 4;
    });

    if (invalidProcedureCodes.length > 0) {
      setPopupVisible(true); // Show pop-up if there are invalid procedure codes
      return;
    }
  
    setError(null);
    setLoading(true);
    
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Error saving submission');
        }

        setFormData(initialFormState);
        sessionStorage.setItem('pdfUploaded', 'false'); // Reset the flag here
        navigate('/'); // Redirect to the landing page

      } catch (error) {
        setError('Error saving submission');
      } finally {
        setLoading(false); // Reset loading state after processing
      }
    }, 1000); // Display loading message for at least half a second
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const addCode = (type: 'procedureCodes' | 'diagnosisCodes') => {
    setFormData(prevData => ({
      ...prevData,
      [type]: [...prevData[type], { id: crypto.randomUUID(), value: '' }]
    }));
  };

  const removeCode = (type: 'procedureCodes' | 'diagnosisCodes', id: string) => {
    setFormData(prevData => ({
      ...prevData,
      [type]: prevData[type].filter(code => code.id !== id)
    }));
  };

  const handleCodeChange = (
    type: 'procedureCodes' | 'diagnosisCodes',
    id: string,
    value: string
  ) => {
    setFormData(prevData => ({
      ...prevData,
      [type]: prevData[type].map(code =>
        code.id === id ? { ...code, value } : code
      )
    }));
  };

  const closePopup = () => {
    setPopupVisible(false); // Close the pop-up
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Patient Information</h2>

                {/* Error Message Display */}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                {/* Loading Screen */}
                {loading && (
                  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-5 rounded-lg shadow-lg text-center">
                      <p>Validating Prior Authorization Form...</p>
                      <div className="loader mt-4"></div>
                    </div>
                  </div>
                )}

                {/* Popup for Validation Error */}
                {popupVisible && (
                  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-5 rounded-lg shadow-lg text-center">
                      <p>Incorrectly formatted codes. Please try again.</p>
                      <button
                        onClick={closePopup}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                {/* Excel Used Pop-up */}
                {excelPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-5 rounded-lg shadow-lg text-center">
                    <p>Warning: Procedure Codes (If Any) Filled In Using General Codes Not Medical Guidelines</p>
                    <button
                        onClick={() => setExcelPopupVisible(false)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Close
                    </button>
                    </div>
                </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>

                  {/* Procedure Codes Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Procedure Codes</label>
                    {formData.procedureCodes.map((code) => (
                      <div key={code.id} className="flex gap-2">
                        <input
                          type="text"
                          value={code.value}
                          onChange={(e) => handleCodeChange('procedureCodes', code.id, e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                          placeholder="Enter procedure code"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeCode('procedureCodes', code.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCode('procedureCodes')}
                      className="w-full px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Add Procedure Code
                    </button>
                  </div>

                  {/* Diagnosis Codes Section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Diagnosis Codes</label>
                    {formData.diagnosisCodes.map((code) => (
                      <div key={code.id} className="flex gap-2">
                        <input
                          type="text"
                          value={code.value}
                          onChange={(e) => handleCodeChange('diagnosisCodes', code.id, e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                          placeholder="Enter diagnosis code"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeCode('diagnosisCodes', code.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCode('diagnosisCodes')}
                      className="w-full px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Add Diagnosis Code
                    </button>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Details Box for Reason and Annotation */}
      {selectedCode && (
        <div className="fixed right-[calc(40px)] top-1/2 transform -translate-y-1/2 bg-white border rounded-lg shadow-lg p-4 z-50 w-64"> {/* Adjust right value */}
          <button onClick={closeDetailsBox} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
            &times;
          </button>
          <p><strong>Code:</strong> {selectedCode.id}</p>
          <p className="mt-2"><strong>Reason:</strong> {selectedCode.reason}</p>
          <p><strong>Annotation:</strong> {selectedCode.annotation}</p>
        </div>
      )}
      </div>
  );
};