import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';

import './Setting.css';

import './PerformanceSSG.js';

export default function PerformanceSSG() {
  const [performances, setPerformances] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  const [formData, setFormData] = useState({
    player_name: '',
    duration: '',
    field_size: '',
    accelerations: '',
    duels_won: '',
    duels_lost: '',
    balls_lost: '',
    passes_completed: '',
    interceptions: '',
    date: ''
  });

  // Recupera lista giocatori
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('Players').select('Name');
      if (error) {
        console.error('Errore nel recupero dei giocatori:', error.message);
        setPlayers([]);
      } else {
        setPlayers(data.map(p => p.Name));
      }
    };
    fetchPlayers();
  }, []);

  // Recupera performance
  useEffect(() => {
    const fetchPerformances = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestazioni_ssg')
        .select('player_name, ssg_score, date');
      if (error) {
        console.error('Errore nel recupero delle performance SSG:', error.message);
        setPerformances([]);
      } else {
        const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setPerformances(sorted);
      }
      setLoading(false);
    };
    fetchPerformances();
  }, []);

  const calculateSSGScore = (data) => {
    const duration = parseFloat(data.duration) || 0;
    const fieldSize = parseFloat(data.field_size) || 0;
    const accelerations = parseInt(data.accelerations) || 0;
    const duelsWon = parseInt(data.duels_won) || 0;
    const duelsLost = parseInt(data.duels_lost) || 0;
    const ballsLost = parseInt(data.balls_lost) || 0;
    const passesCompleted = parseInt(data.passes_completed) || 0;
    const interceptions = parseInt(data.interceptions) || 0;

    const durationFactor = duration / 10;
    const sizeFactor = fieldSize / 100;
    const acc = accelerations * 2;
    const duels = duelsWon * 1.5 - duelsLost;
    const possession = passesCompleted * 1.2 - ballsLost;
    const interception = interceptions * 1.5;

    return Math.round(durationFactor + sizeFactor + acc + duels + possession + interception);
  };

  const getFeedback = (score) => {
    if (score > 50) {
      return { icon: "🔥", text: "Prestazione eccellente", color: "green" };
    } else if (score >= 40) {
      return { icon: "👍", text: "Buona prestazione", color: "limegreen" };
    } else if (score >= 30) {
      return { icon: "⚠️", text: "Prestazione media", color: "orange" };
    } else {
      return { icon: "❌", text: "Prestazione insufficiente", color: "red" };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const score = calculateSSGScore(formData);
    const { error } = await supabase.from('prestazioni_ssg').insert([
      { ...formData, ssg_score: score }
    ]);
    if (error) {
      console.error("Errore durante l'inserimento:", error.message);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <h1>Performance SSG</h1>

      <form onSubmit={handleSubmit} className="ssg-form">
        <select
          name="player_name"
          value={formData.player_name}
          onChange={handleChange}
          required
        >
          <option value="">Seleziona un giocatore</option>
          {players.map((name, i) => (
            <option key={i} value={name}>{name}</option>
          ))}
        </select>

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="duration"
          placeholder="Duration (min)"
          value={formData.duration}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="field_size"
          placeholder="Field Size (m²)"
          value={formData.field_size}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="accelerations"
          placeholder="Accelerations"
          value={formData.accelerations}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="duels_won"
          placeholder="Duels Won"
          value={formData.duels_won}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="duels_lost"
          placeholder="Duels Lost"
          value={formData.duels_lost}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="balls_lost"
          placeholder="Balls Lost"
          value={formData.balls_lost}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="passes_completed"
          placeholder="Passes Completed"
          value={formData.passes_completed}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="interceptions"
          placeholder="Interceptions"
          value={formData.interceptions}
          onChange={handleChange}
          required
        />
        <button type="submit">Add Performance</button>
      </form>

      {loading ? (
        <p>Loading performances...</p>
      ) : (
        <>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="filter-input"
          >
            <option value="">Tutti i giocatori</option>
            {players.map((name, i) => (
              <option key={i} value={name}>{name}</option>
            ))}
          </select>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Date</th>
                <th>SSG Score</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {performances
                .filter(p => selectedPlayer === '' || p.player_name === selectedPlayer)
                .map((p, i) => {
                  const fb = getFeedback(p.ssg_score);
                  return (
                    <tr key={i}>
                      <td>{p.player_name}</td>
                      <td>{new Date(p.date).toLocaleDateString()}</td>
                      <td>{p.ssg_score}</td>
                      <td style={{ color: fb.color }}>
                        {fb.icon} {fb.text}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
