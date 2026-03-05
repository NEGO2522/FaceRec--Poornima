import React, { useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

const App = () => {
  // This state will hold the 10,000+ rows from your CSV
  const [csvData, setCsvData] = useState(null);

  // This is the function that was "missing"
  const handleUploadFinished = (data) => {
    console.log("Data received from CSV:", data.length, "rows");
    setCsvData(data); // Storing data triggers the switch to Dashboard
  };

  const handleGoBack = () => {
    setCsvData(null); // Clearing data takes us back to Landing
  };

  return (
    <div className="app-container">
      {!csvData ? (
        // We pass the function here as a prop
        <Landing onUploadFinished={handleUploadFinished} />
      ) : (
        // If we have data, show the Dashboard instead
        <Dashboard csvData={csvData} onBack={handleGoBack} />
      )}
    </div>
  );
};

export default App;