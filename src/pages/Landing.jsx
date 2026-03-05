import React, { useState, useRef } from 'react';
import { FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

const Landing = ({ onUploadFinished }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setError(null);

    if (!selectedFile) return;

    // Validate File Type
    if (!selectedFile.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      return;
    }

    // Validate Size (40MB)
    const maxSize = 40 * 1024 * 1024; 
    if (selectedFile.size > maxSize) {
      setError("File is too large. Max limit is 40 MB.");
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split(/\r?\n/).map(row => row.split(','));
        
        // 1. Identify Header Indices based on your specific CSV structure
        const headers = rows[0].map(h => h.trim());
        const codeIdx = headers.indexOf("Employee Code");
        const nameIdx = headers.indexOf("Employee Name/Visitor Name");
        const dateIdx = headers.indexOf("Punch Date");
        const timeIdx = headers.indexOf("Punch Time");
        const flagIdx = headers.indexOf("IN/OUT Flag");

        // 2. Parse and Clean Data
        const jsonData = rows.slice(1)
          .filter(row => {
            // Filter out empty rows and "Branch" separator rows found in your data
            return row.length >= 5 && row[codeIdx] && !row[codeIdx].includes("Branch");
          })
          .map(row => ({
            uid: row[codeIdx]?.trim(),
            name: row[nameIdx]?.trim(),
            date: row[dateIdx]?.trim(),
            time: row[timeIdx]?.trim(),
            // Map "IN" to "Inside" and "OUT" to "Outside" for Dashboard logic
            status: row[flagIdx]?.trim() === 'IN' ? 'Inside' : 'Outside'
          }));

        setFiles([{
          name: selectedFile.name,
          size: (selectedFile.size / (1024 * 1024)).toFixed(1) + " MB",
          status: 'Completed'
        }]);

        // Small delay for UI smoothness before switching to Dashboard
        setTimeout(() => {
          if (typeof onUploadFinished === 'function') {
            onUploadFinished(jsonData);
          }
          setIsProcessing(false);
        }, 1000);

      } catch (err) {
        setError("Failed to parse CSV structure.");
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Error reading file.");
      setIsProcessing(false);
    };

    reader.readAsText(selectedFile);
  };

  const triggerBrowse = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col lg:flex-row antialiased font-sans text-white">
      
      {/* LEFT SIDE: Visual Identity */}
      <div className="w-full lg:w-1/2 h-64 lg:h-screen relative overflow-hidden order-1">
        <img 
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070" 
          alt="Biometric Security" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0f1115] via-transparent to-transparent hidden lg:block" />
        <div className="absolute bottom-10 left-10 hidden lg:block">
          <h1 className="text-4xl font-bold mb-2">Gate Intelligence</h1>
          <p className="text-gray-400 max-w-md">Analyze real-time student flow and entry patterns with biometric data integration.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Action Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 order-2">
        <div className="w-full max-w-xl">
          
          <div className="mb-8 text-blue-400 text-3xl font-bold tracking-tight italic select-none">
            Poornima University
          </div>

          <div className="bg-[#1a1d23] rounded-3xl shadow-2xl border border-gray-800 p-8">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            <div className="mb-6">
              <h2 className="text-xl font-semibold">Gate Data Upload</h2>
              <p className="text-gray-400 text-sm">Upload the biometric log CSV to generate analytics</p>
            </div>

            <div 
              onClick={!isProcessing ? triggerBrowse : null}
              className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                error ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`p-4 rounded-full mb-4 ${error ? 'bg-red-900/20' : 'bg-gray-800'}`}>
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                ) : error ? (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                ) : (
                  <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                )}
              </div>
              
              <h3 className="text-lg font-medium text-gray-200">
                {isProcessing ? "Analyzing Poornima Logs..." : error ? "Upload Failed" : "Select CSV File"}
              </h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                {error || "Accepts raw biometric export up to 40MB"}
              </p>

              <button className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                {isProcessing ? "Processing..." : "Browse Local Files"}
              </button>
            </div>

            {/* Success List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="bg-emerald-500 p-2 rounded-lg">
                      <FileSpreadsheet size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-200">{file.name}</h4>
                      <p className="text-xs text-emerald-500 font-medium">Ready for Dashboard Analysis</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;