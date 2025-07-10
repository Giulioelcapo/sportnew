import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function Monitoring() {
  // Stato giocatori e form inserimento
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [applyDateToAll, setApplyDateToAll] = useState(true);
  const [dateAll, setDateAll] = useState('');
  const [formData, setFormData] = useState({});

  // Stato filtro risultati
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [monitoringResults, setMonitoringResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Carico giocatori
  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const { data, error } = await supabase.from('Players').select('Name');
    if (error) {
      console.error('Errore fetch players:', error);
      return;
    }
    setPlayers(data || []);
  }

  // Form inserimento

  const handleSelectAll = (e) => {
    setSelectedPlayers(e.target.checked ? players.map((p) => p.Name) : []);
  };

  const handlePlayerCheckbox = (playerName, checked) => {
    setSelectedPlayers((prev) =>
      checked ? [...prev, playerName] : prev.filter((n) => n !== playerName)
    );
  };

  const handleInputChange = (playerName, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [playerName]: {
        ...prev[playerName],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!dateAll && applyDateToAll) {
      alert('Inserisci la data per tutti i giocatori.');
      return;
    }
    if (selectedPlayers.length === 0) {
      alert('Seleziona almeno un giocatore.');
      return;
    }

    const entriesToInsert = [];

    for (const name of selectedPlayers) {
      const data = formData[name] || {};
      const dateToUse = applyDateToAll ? dateAll : data.date;

      if (!dateToUse) {
        alert(`Inserisci la data per il giocatore ${name}`);
        return;
      }

      entriesToInsert.push({
        name,
        date: dateToUse,
        soreness_muscle: Number(data.soreness_muscle) || 0,
        soreness_joint: Number(data.soreness_joint) || 0,
        sleep_hours: Number(data.sleep_hours) || 0,
        food_and_drink: Number(data.food_and_drink) || 0,
        stress: Number(data.stress) || 0,
      });
    }

    const { error } = await supabase.from('MonitoringData').insert(entriesToInsert);
    if (error) {
      alert('Errore nel salvataggio: ' + error.message);
    } else {
      alert('Dati salvati con successo');
      setFormData({});
      setSelectedPlayers([]);
      setDateAll('');
      setApplyDateToAll(true);
      fetchResults(); // aggiorna i dati dopo salvataggio
    }
  };

  // Carico risultati in base ai filtri
  async function fetchResults() {
    setLoadingResults(true);

    let query = supabase.from('MonitoringData').select('*');

    if (filterName) {
      query = query.eq('name', filterName);
    }
    if (filterDate) {
      query = query.eq('date', filterDate);
    }

    const { data, error } = await query;
    if (error) {
      alert('Errore caricamento dati: ' + error.message);
      setMonitoringResults([]);
      setLoadingResults(false);
      return;
    }
    setMonitoringResults(data || []);
    setLoadingResults(false);
  }

  // Quando cambia filtro aggiorna i risultati
  useEffect(() => {
    fetchResults();
  }, [filterName, filterDate]);

  // --- Calcola ultimo dato per giocatore (per media squadra e grafico singolo) ---
  function getLastEntryPerPlayer(data) {
    const lastEntryMap = {};
    data.forEach((entry) => {
      if (
        !lastEntryMap[entry.name] ||
        new Date(entry.date) > new Date(lastEntryMap[entry.name].date)
      ) {
        lastEntryMap[entry.name] = entry;
      }
    });
    return Object.values(lastEntryMap);
  }

  // Calcolo media squadra sui dati più recenti di ogni giocatore
  function calculateTeamAveragesFromLastEntries(data) {
    if (!data.length) return null;

    const lastEntries = getLastEntryPerPlayer(data);

    const total = {
      soreness_muscle: 0,
      soreness_joint: 0,
      sleep_hours: 0,
      food_and_drink: 0,
      stress: 0,
    };

    lastEntries.forEach((d) => {
      total.soreness_muscle += d.soreness_muscle || 0;
      total.soreness_joint += d.soreness_joint || 0;
      total.sleep_hours += d.sleep_hours || 0;
      total.food_and_drink += d.food_and_drink || 0;
      total.stress += d.stress || 0;
    });

    const count = lastEntries.length;
    return {
      name: 'Media Squadra',
      soreness_muscle: +(total.soreness_muscle / count).toFixed(2),
      soreness_joint: +(total.soreness_joint / count).toFixed(2),
      sleep_hours: +(total.sleep_hours / count).toFixed(2),
      food_and_drink: +(total.food_and_drink / count).toFixed(2),
      stress: +(total.stress / count).toFixed(2),
      // date: '-', // opzionale
    };
  }

  // Dati ultimi per giocatore per grafico singolo (usati nella lista)
  const lastEntries = getLastEntryPerPlayer(monitoringResults);

  // Calcola media squadra da usare in tabella e grafico squadra
  const teamAvg = calculateTeamAveragesFromLastEntries(monitoringResults);

  // Per tabella e grafico squadra: dati + media squadra
  const dataWithAvg = teamAvg ? [...monitoringResults, teamAvg] : monitoringResults;

  // Mappa ultimo dato per giocatore per accesso veloce
  const lastEntryMap = {};
  lastEntries.forEach((entry) => {
    lastEntryMap[entry.name] = entry;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Inserisci dati Monitoring</h2>

      {/* Form inserimento */}
      <div>
        <label>
          <input type="checkbox" checked={applyDateToAll} onChange={() => setApplyDateToAll(!applyDateToAll)} />
          {' '}Applicare la stessa data a tutti i giocatori
        </label>
        {applyDateToAll && (
          <input
            type="date"
            value={dateAll}
            onChange={(e) => setDateAll(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <label>
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={selectedPlayers.length === players.length && players.length > 0}
          />
          {' '}Seleziona tutti i giocatori
        </label>
      </div>

      <div style={{ marginTop: 20 }}>
        {players.map((player) => {
          const isSelected = selectedPlayers.includes(player.Name);
          const playerData = formData[player.Name] || {};
          const lastEntry = lastEntryMap[player.Name] || null;

          return (
            <div key={player.Name} style={{ marginBottom: 25, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handlePlayerCheckbox(player.Name, e.target.checked)}
                />{' '}
                {player.Name}
              </label>

              {isSelected && (
                <>
                  <div style={{ marginLeft: 20, marginTop: 5 }}>
                    {!applyDateToAll && (
                      <div>
                        <label>Data:{' '}
                          <input
                            type="date"
                            value={playerData.date || ''}
                            onChange={(e) => handleInputChange(player.Name, 'date', e.target.value)}
                          />
                        </label>
                      </div>
                    )}

                    <div>
                      <input
                        type="number"
                        placeholder="Soreness Muscle"
                        value={playerData.soreness_muscle || ''}
                        onChange={(e) => handleInputChange(player.Name, 'soreness_muscle', e.target.value)}
                        style={{ width: 130, marginRight: 10 }}
                      />
                      <input
                        type="number"
                        placeholder="Soreness Joint"
                        value={playerData.soreness_joint || ''}
                        onChange={(e) => handleInputChange(player.Name, 'soreness_joint', e.target.value)}
                        style={{ width: 130, marginRight: 10 }}
                      />
                      <input
                        type="number"
                        placeholder="Sleep Hours"
                        value={playerData.sleep_hours || ''}
                        onChange={(e) => handleInputChange(player.Name, 'sleep_hours', e.target.value)}
                        style={{ width: 130, marginRight: 10 }}
                      />
                      <input
                        type="number"
                        placeholder="Food & Drink"
                        value={playerData.food_and_drink || ''}
                        onChange={(e) => handleInputChange(player.Name, 'food_and_drink', e.target.value)}
                        style={{ width: 130 }}
                      />
                      <input
                        type="number"
                        placeholder="Stress"
                        value={playerData.food_and_drink || ''}
                        onChange={(e) => handleInputChange(player.Name, 'stress', e.target.value)}
                        style={{ width: 130 }}
                      />
                    </div>
                  </div>

                  {/* Grafico singolo giocatore per ultimo dato */}
                  {lastEntry && (
                    <div style={{ width: 350, height: 220, marginTop: 10 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={[lastEntry]}
                          margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="soreness_muscle" fill="#8884d8" name="Soreness Muscle" />
                          <Bar dataKey="soreness_joint" fill="#82ca9d" name="Soreness Joint" />
                          <Bar dataKey="sleep_hours" fill="#ffc658" name="Sleep Hours" />
                          <Bar dataKey="food_and_drink" fill="#d88484" name="Food & Drink" />
                          <Bar dataKey="stress" fill="#d88484" name="Stress" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleSave} style={{ marginTop: 20, padding: '10px 15px' }}>
        Salva dati
      </button>

      <hr style={{ margin: '40px 0' }} />

      <h2>Filtra e visualizza risultati</h2>

      <div>
        <label>
          Nome giocatore:{' '}
          <select value={filterName} onChange={(e) => setFilterName(e.target.value)}>
            <option value="">Tutti</option>
            {players.map((p) => (
              <option key={p.Name} value={p.Name}>
                {p.Name}
              </option>
            ))}
          </select>
        </label>
        {' '}
        <label>
          Data:{' '}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </label>
        {' '}
        <button onClick={fetchResults}>Aggiorna</button>
      </div>

      {loadingResults ? (
        <p>Caricamento dati...</p>
      ) : (
        <>
          <h3>Dati monitoraggio</h3>
          {monitoringResults.length === 0 ? (
            <p>Nessun dato disponibile.</p>
          ) : (
            <>
              {/* Tabella dati */}
              <table border="1" cellPadding="5" cellSpacing="0" style={{ borderCollapse: 'collapse', marginTop: 10, width: '100%' }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Data</th>
                    <th>Soreness Muscle</th>
                    <th>Soreness Joint</th>
                    <th>Sleep Hours</th>
                    <th>Food & Drink</th>
                    <th>Stress</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoringResults.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.date}</td>
                      <td>{r.soreness_muscle}</td>
                      <td>{r.soreness_joint}</td>
                      <td>{r.sleep_hours}</td>
                      <td>{r.food_and_drink}</td>
                      <td>{r.stress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Grafico singolo giocatore filtrato (ultimo dato) */}
              {filterName && lastEntryMap[filterName] && (
                <>
                  <h3>Grafico Giocatore: {filterName} (ultimo dato)</h3>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={[lastEntryMap[filterName]]} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="soreness_muscle" fill="#8884d8" name="Soreness Muscle" />
                        <Bar dataKey="soreness_joint" fill="#82ca9d" name="Soreness Joint" />
                        <Bar dataKey="sleep_hours" fill="#ffc658" name="Sleep Hours" />
                        <Bar dataKey="food_and_drink" fill="#d88484" name="Food & Drink" />
                        <Bar dataKey="stress" fill="#d88484" name="Stress" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {/* Grafico media squadra (ultimo dato per ogni giocatore) */}
              {lastEntries.length > 0 && (
                <>
                  <h3>Media Squadra (ultimo dato per giocatore)</h3>
                  <div style={{ width: '200%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={lastEntries} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="soreness_muscle" fill="#8884d8" name="Soreness Muscle" />
                        <Bar dataKey="soreness_joint" fill="#82ca9d" name="Soreness Joint" />
                        <Bar dataKey="sleep_hours" fill="#ffc658" name="Sleep Hours" />
                        <Bar dataKey="food_and_drink" fill="#d88484" name="Food & Drink" />
                        <Bar dataKey="stress" fill="#d88484" name="Stress" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      {teamAvg && (
        <div style={{ width: '200%', maxWidth: 700, height: 350, marginTop: 40 }}>
          <h3>Media Squadra</h3>
          <ResponsiveContainer width="300%" height="100%">
            <BarChart
              data={[teamAvg]}
              margin={{ top: 40, right: 30, bottom: 40, left: 20 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="soreness_muscle" fill="#8884d8" name="Soreness Muscle" barSize={50} />
              <Bar dataKey="soreness_joint" fill="#82ca9d" name="Soreness Joint" barSize={50} />
              <Bar dataKey="sleep_hours" fill="#ffc658" name="Sleep Hours" barSize={50} />
              <Bar dataKey="food_and_drink" fill="#d88484" name="Food & Drink" barSize={50} />
              <Bar dataKey="stress" fill="#d88484" name="Stress" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
