import React, { useState } from 'react';
import ZigZag from './ZigZag';
import './App.css';

// We use the standard browser 'fetch' instead of Apollo to avoid build errors
const LINERA_URL = 'http://localhost:8080'; 

function App() {
  const [lastSaved, setLastSaved] = useState(null);

  const saveScoreToBlockchain = async (score) => {
    console.log("Attempting to save score:", score);
    
    // This is the raw GraphQL query string
    const query = `
      mutation {
        submitScore(score: ${score})
      }
    `;

    try {
      const response = await fetch(LINERA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      console.log("Blockchain Response:", result);

      if (result.errors) {
        console.error("Blockchain Error:", result.errors);
        alert("Error saving to chain (See console)");
      } else {
        setLastSaved(score);
        alert(`Success! Score ${score} saved to Linera.`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      // We don't alert here to avoid annoying popups if the chain isn't running yet
    }
  };

  return (
    <div className="App">
      <h1>Linera ZigZag</h1>
      {lastSaved !== null && <p style={{color: '#00ff00'}}>High Score on Chain: {lastSaved}</p>}
      
      {/* Pass the save function to the game */}
      <ZigZag onGameOver={saveScoreToBlockchain} />
    </div>
  );
}

export default App;