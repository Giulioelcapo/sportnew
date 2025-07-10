import React, { useState } from 'react';

function VideoAnalysis() {
  const [video, setVideo] = useState(null);
  const [message, setMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileChange = (e) => {
    setVideo(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!video) {
      setMessage('Seleziona un video prima di caricare');
      return;
    }

    const formData = new FormData();
    formData.append('video', video);

    try {
      const res = await fetch('http://127.0.0.1:5000/upload-video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setMessage(data.message || 'Upload completato');
      setAnalysisResult(data); // salvo i dati ricevuti dall’API
    } catch (error) {
      setMessage('Errore nel caricamento');
      setAnalysisResult(null);
    }
  };

  return (
    <div>
      <h1>Analisi Video</h1>

      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Carica Video</button>
      <p>{message}</p>

      {analysisResult && (
        <div>
          <h2>Risultati Analisi</h2>
          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
          {/* Qui puoi personalizzare la visualizzazione dei risultati */}
        </div>
      )}
    </div>
  );
}

export default VideoAnalysis;
