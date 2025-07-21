import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Configura Supabase
const supabase = createClient(
    'https://efzgpbneonewotqxozau.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg'
);

export default function ACWRPage() {
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState({});
    const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
    const [selectAll, setSelectAll] = useState(false);
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [viewPlayer, setViewPlayer] = useState(null);
    const [fetchedWorkloads, setFetchedWorkloads] = useState([]);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        const { data, error } = await supabase.from('Players').select('*');
        if (error) {
            console.error('Errore caricamento giocatori:', error);
            return;
        }

        const initial = {};
        const checks = {};
        data.forEach(p => {
            initial[p.Name] = {
                rpe: '',
                volume: '',
                load: 0,
                weeklyLoad: 0,
                chronicLoad: 0,
                acwr: '-',
                todayLoad: 0,
                date: date,
            };
            checks[p.Name] = false;
        });

        setPlayers(data);
        setSelectedPlayers(initial);
        setSelectedCheckboxes(checks);
        fetchWorkloads(data, initial);
    };

    const fetchWorkloads = async (playersList, baseState) => {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 28);
        const isoDate = fromDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('workloads')
            .select('*')
            .gte('date', isoDate)
            .order('date', { ascending: false });

        if (error) {
            console.error('Errore caricamento workloads:', error);
            return;
        }

        setFetchedWorkloads(data);
        const newState = { ...baseState };

        playersList.forEach(player => {
            const playerLoads = data.filter(w => w.name === player.Name);
            const weeklyLoads = [];

            for (let i = 0; i < 4; i++) {
                const start = new Date();
                Start.setDate(Start.getDate() - (7 * (i + 1)) + 1);
                const end = new Date();
                weekEnd.setDate(end.getDate() - (7 * i) - 1);

                const weekLoad = playerLoads
                    .filter(w => {
                        const wDate = new Date(w.date);
                        return wDate >= start && wDate <= end;
                    })
                    .reduce((acc, w) => acc + w.daily_load, 0);

                weeklyLoads.push(weekLoad);
            }
            const acuteLoad = weeklyLoads[0];
            const chronicLoad = weeklyLoads.reduce((acc, val) => acc + val, 0) / 4;
            const acwr = chronicLoad > 0 ? (acuteLoad / chronicLoad).toFixed(2) : '-';


            newState[player.Name] = {
                ...newState[player.Name],
                weeklyLoad: acuteLoad,
                chronicLoad,
                acwr,
                todayLoad: playerLoads.filter(w => w.date === date).reduce((a, w) => a + w.daily_load, 0),
                date,
            };
        });

        setSelectedPlayers(newState);
    };

    const handleInputChange = (name, field, value) => {
        const rpe = field === 'rpe' ? Number(value) : Number(selectedPlayers[name].rpe);
        const volume = field === 'volume' ? Number(value) : Number(selectedPlayers[name].volume);
        const load = rpe * volume;

        setSelectedPlayers(prev => ({
            ...prev,
            [name]: {
                ...prev[name],
                [field]: value,
                load,
            }
        }));
    };

    const handleCheckboxChange = (name) => {
        setSelectedCheckboxes(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const toggleSelectAll = () => {
        const newValue = !selectAll;
        const updatedChecks = {};
        const updatedData = {};

        players.forEach(p => {
            updatedChecks[p.Name] = newValue;
            updatedData[p.Name] = {
                ...selectedPlayers[p.Name],
                date: date,
            };
        });

        setSelectedCheckboxes(updatedChecks);
        setSelectedPlayers(updatedData);
        setSelectAll(newValue);
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setDate(newDate);

        const updated = {};
        players.forEach(p => {
            updated[p.Name] = {
                ...selectedPlayers[p.Name],
                date: newDate,
            };
        });
        setSelectedPlayers(updated);
    };

    const saveWorkloads = async () => {
        const workloads = [];

        for (const p of players) {
            if (!selectedCheckboxes[p.Name]) continue;
            const d = selectedPlayers[p.Name];
            if (d.rpe && d.volume) {
                workloads.push({
                    date: d.date,
                    name: p.Name,
                    RPE: Number(d.rpe),
                    daily_load: Number(d.load),
                    weekly_load: Number(d.weeklyLoad),
                    ACWR: d.acwr === '-' ? null : Number(d.acwr),
                });
            }
        }

        if (workloads.length === 0) {
            alert('Nessun dato da salvare');
            return;
        }

        const { error } = await supabase.from('workloads').insert(workloads);
        if (error) {
            console.error('Errore salvataggio:', error);
            alert('Errore nel salvataggio!');
            return;
        }

        alert('Dati salvati!');
        fetchPlayers();
    };

    const chartData = viewPlayer
        ? fetchedWorkloads
            .filter(w => w.name === viewPlayer)
            .map(w => ({
                date: w.date,
                daily_load: w.daily_load,
                weekly_load: w.weekly_load,
                ACWR: w.ACWR,
            }))
            .reverse()
        : [];

    return (
        <main className="content">
            <div className="header">
                <Link to="/" className="back-button">⬅ Dashboard</Link>
            </div>

            <h2>📅 Daily Load</h2>

            <label>
                Data:
                <input type="date" value={date} onChange={handleDateChange} />
            </label>

            <div className="button-row">
                <button onClick={saveWorkloads}>💾 Save</button>
                <button onClick={toggleSelectAll}>
                    {selectAll ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </button>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>✔</th>
                        <th>Players</th>
                        <th>RPE</th>
                        <th>Volume</th>
                        <th>Load</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map(p => (
                        <tr key={p.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedCheckboxes[p.Name] || false}
                                    onChange={() => handleCheckboxChange(p.Name)}
                                />
                            </td>
                            <td>{p.Name}</td>
                            <td>
                                <input
                                    type="number"
                                    value={selectedPlayers[p.Name]?.rpe || ''}
                                    onChange={(e) => handleInputChange(p.Name, 'rpe', e.target.value)}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    value={selectedPlayers[p.Name]?.volume || ''}
                                    onChange={(e) => handleInputChange(p.Name, 'volume', e.target.value)}
                                />
                            </td>
                            <td>{selectedPlayers[p.Name]?.load || 0}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2 style={{ marginTop: 40 }}>📊 View data by player</h2>
            <select
                value={viewPlayer || ''}
                onChange={(e) => setViewPlayer(e.target.value)}
            >
                <option value="" disabled>Seleziona un giocatore</option>
                {players.map(p => (
                    <option key={p.id} value={p.Name}>{p.Name}</option>
                ))}
            </select>

            {viewPlayer && (
                <>
                    <h3>📈 Grafico a barre</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="daily_load" fill="#8884d8" name="Daily Load" />
                            <Bar dataKey="weekly_load" fill="#82ca9d" name="Weekly Load" />
                        </BarChart>
                    </ResponsiveContainer>

                    <table className="data-table" style={{ marginTop: 20 }}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Date</th>
                                <th>Daily Load</th>
                                <th>Weekly Load</th>
                                <th>ACWR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.map((d, i) => (
                                <tr key={i}>
                                    <td>{viewPlayer}</td>
                                    <td>{d.date}</td>
                                    <td>{d.daily_load}</td>
                                    <td>{d.weekly_load}</td>
                                    <td>{d.ACWR}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    );
}
