import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import './Setting.css';

export default function Home() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [workloads, setWorkloads] = useState({ daily: [], weekly: [], ACWR: [] });
    const [injuryAlerts, setInjuryAlerts] = useState([]);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('Minuti giocati')
                .select('Name, minutes_played');

            if (error) {
                console.error('Errore nel recupero dei giocatori:', error.message);
                setPlayers([]);
            } else {
                const sorted = (data || []).sort((a, b) => (b.minutes_played || 0) - (a.minutes_played || 0));
                setPlayers(sorted);
            }
            setLoading(false);
        };

        const fetchWorkloads = async () => {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);

            const { data, error } = await supabase
                .from('workloads')
                .select('name, daily_load, weekly_load, ACWR, date')
                .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

            if (error) {
                console.error('Errore nel recupero dei workloads:', error.message);
                setWorkloads({ daily: [], weekly: [], ACWR: [] });
            } else {
                const latestDate = data.map(entry => entry.date).sort().reverse()[0];

                const daily = data
                    .filter(entry => entry.date === latestDate)
                    .sort((a, b) => (b.daily_load || 0) - (a.daily_load || 0));

                const weeklyMap = {};
                const acwrMap = {};

                data.forEach(entry => {
                    if (!weeklyMap[entry.name]) {
                        weeklyMap[entry.name] = { name: entry.name, weekly_load: 0 };
                    }
                    weeklyMap[entry.name].weekly_load += entry.weekly_load || 0;

                    if (entry.date === latestDate) {
                        acwrMap[entry.name] = { name: entry.name, ACWR: entry.ACWR || 0 };
                    }
                });

                const weekly = Object.values(weeklyMap).sort((a, b) => (b.weekly_load || 0) - (a.weekly_load || 0));
                const ACWR = Object.values(acwrMap).sort((a, b) => (b.ACWR || 0) - (a.ACWR || 0));

                setWorkloads({ daily, weekly, ACWR });
            }
        };

        const fetchInjuryAlerts = async () => {
            const { data, error } = await supabase
                .from('Injury')
                .select('Name');

            if (error) {
                console.error('Errore nel recupero degli infortuni:', error.message);
                setInjuryAlerts([]);
            } else {
                const injuryCounts = {};
                data.forEach(({ Name }) => {
                    injuryCounts[Name] = (injuryCounts[Name] || 0) + 1;
                });

                const sortedAlerts = Object.entries(injuryCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);

                setInjuryAlerts(sortedAlerts);
            }
        };

        fetchPlayers();
        fetchWorkloads();
        fetchInjuryAlerts();
    }, []);

    const renderTable = ({ title, data, key, multiplier = 1 }) => (
        <div
            className="table-wrapper scrollable"
            style={{
                flex: '1 1 45%',
                maxHeight: '350px',
                overflowY: 'auto',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '10px',
                backgroundColor: '#fff',
            }}
        >
            <h2 style={{ marginBottom: '10px' }}>{title}</h2>
            <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' }}>
                            Player
                        </th>
                        <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' }}>
                            {key === 'ACWR' ? 'ACWR' : 'Load'}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((entry, idx) => {
                        const playerName = entry.Name || entry.name || 'Unknown';
                        const value = entry[key] || 0;
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '6px 8px' }}>
                                    <Link to={`/Players/${encodeURIComponent(playerName)}`}>{playerName}</Link>
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                    <div className="value-with-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{value}</span>
                                        <div
                                            className="bar"
                                            style={{
                                                height: '10px',
                                                backgroundColor: '#007bff',
                                                width: `${value * multiplier}%`,
                                                borderRadius: '4px',
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div
            className="dashboard-container"
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                backgroundColor: '#f9f9f9',
                minHeight: '100vh',
                boxSizing: 'border-box',
            }}
        >
            <header style={{ marginBottom: '30px' }}>
                <h1>Welcome to the Sport Home</h1>
                <p>Select a player from the table below to view details.</p>
            </header>

            {loading ? (
                <p>Caricamento giocatori...</p>
            ) : (
                <>
                    <section className="tables-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        {renderTable({ title: 'Minutes Played', data: players, key: 'minutes_played' })}
                        {renderTable({ title: 'Daily Load', data: workloads.daily, key: 'daily_load' })}
                    </section>

                    <section className="tables-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        {renderTable({ title: 'Weekly Load', data: workloads.weekly, key: 'weekly_load' })}
                        {renderTable({ title: 'ACWR', data: workloads.ACWR, key: 'ACWR', multiplier: 20 })}
                    </section>

                    <section
                        className="injury-alerts"
                        style={{
                            maxWidth: '700px',
                            margin: '0 auto',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: '#fff',
                            padding: '10px',
                        }}
                    >
                        <h2 style={{ marginBottom: '10px' }}>Injury Alerts</h2>
                        <table className="styled-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' }}>Player</th>
                                    <th style={{ textAlign: 'left', borderBottom: '2px solid #ccc', padding: '8px' }}>Injuries</th>
                                </tr>
                            </thead>
                            <tbody>
                                {injuryAlerts.map((entry, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '6px 8px' }}>
                                            <Link to={`/Players/${encodeURIComponent(entry.name)}`}>{entry.name}</Link>
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                            <div className="value-with-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{entry.count}</span>
                                                <div
                                                    className="bar"
                                                    style={{
                                                        height: '10px',
                                                        backgroundColor: '#dc3545',
                                                        width: `${entry.count * 10}%`,
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </div>
    );
}
