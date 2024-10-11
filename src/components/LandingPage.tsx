// src/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const navigate = useNavigate();

  // Reset pdfUploaded to 'false' whenever the Landing Page loads
  useEffect(() => {
    sessionStorage.setItem('pdfUploaded', 'false');
  }, []); // This will run once when the component mounts

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
  
    setLoading(true); // Set loading to true

    const formData = new FormData();
    formData.append('file', file);
  
    try {
      // Make sure to adjust the URL to your backend endpoint
      const response = await fetch('http://localhost:10000/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Error uploading file');
      }

      const data = await response.json(); // Capture the JSON response
      console.log('Upload successful:', data); // Log the response data for debugging

      const patientName = data.data.patientName;
      const dateOfBirth = data.data.dateOfBirth;
      const [firstName, ...lastNameParts] = patientName.split(' ');
      const lastName = lastNameParts.join(' '); // Join the rest as the last name
      const relevantDiagnosis = data.relevantDiagnosis;
      const relevantProcedure = data.relevantProcedure; 
      const excelUsed = data.excel;
      sessionStorage.setItem('pdfUploaded', 'true');

      // Show success message

      navigate('/form', { state: { firstName, lastName, dateOfBirth, relevantDiagnosis, relevantProcedure, excelUsed} });
    } catch (error) {
      setError('Error uploading file');
    }
    finally {
        setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Upload Doctor's Note
        </h2>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        {/* Loading Spinner Popup */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
            <div className="bg-white p-5 rounded-lg shadow-lg text-center">
              <p>Prior Authorization Form Being Generated...</p>
              <div className="loader mt-4"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            required
            className="mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Upload
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Make sure your file is a PDF document.
        </p>
      </div>

      {/* Add CSS for the loader */}
      <style>{`
        .loader {
          border: 8px solid #f3f3f3; /* Light grey */
          border-top: 8px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
