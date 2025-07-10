import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function Statistiche() {
    const [form, setForm] = useState({
        match_id: "",
        player_name: "",
        minutes_played: "",
        shots: "",
        assists: "",
        errors: "",
        match_rating: "",
    });

    const [data, setData] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        fetchPlayers();
        fetchData();
    }, []);

    async function fetchPlayers() {
        const { data, error } = await supabase.from("Players").select("Name");
        if (error) {
            alert("Errore caricamento giocatori: " + error.message);
        } else {
            setPlayers(data.map((p) => p.Name));
        }
    }

    async function fetchData() {
        setLoading(true);
        const { data, error } = await supabase.from("match_stats").select("*");
        if (error) {
            alert("Errore caricamento dati: " + error.message);
        } else {
            setData(data);
        }
        setLoading(false);
    }

    async function addRecord(e) {
        e.preventDefault();

        if (Object.values(form).some((val) => val === "")) {
            alert("Compila tutti i campi!");
            return;
        }

        const newRecord = {
            match_id: form.match_id,
            player_name: form.player_name,
            minutes_played: parseInt(form.minutes_played, 10),
            shots: parseInt(form.shots, 10),
            assists: parseInt(form.assists, 10),
            errors: parseInt(form.errors, 10),
            match_rating: parseFloat(form.match_rating),
        };

        const { data: insertedData, error } = await supabase
            .from("match_stats")
            .insert([newRecord])
            .select();

        if (error) {
            alert("Errore inserimento: " + error.message);
        } else {
            setData((prev) => [...prev, insertedData[0]]);
            setForm({
                match_id: "",
                player_name: "",
                minutes_played: "",
                shots: "",
                assists: "",
                errors: "",
                match_rating: "",
            });
        }
    }

    function doBasicAnalysis() {
        if (data.length === 0) {
            alert("Nessun dato disponibile per analisi");
            return;
        }

        const n = data.length;
        const avg = (key) => data.reduce((acc, d) => acc + d[key], 0) / n;

        setAnalysis({
            avgMinutes: avg("minutes_played"),
            avgShots: avg("shots"),
            avgAssists: avg("assists"),
            avgErrors: avg("errors"),
            avgRating: avg("match_rating"),
        });
    }

    async function doClustering() {
        if (data.length === 0) return alert("Nessun dato disponibile per clustering");

        try {
            const payload = data.map(({ minutes_played, shots, assists, errors, match_rating }) => ({
                minutes_played,
                shots,
                assists,
                errors,
                match_rating,
            }));

            const res = await fetch("http://127.0.0.1:8000/cluster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            const result = await res.json();
            if (!result.clusters || result.clusters.length !== data.length) {
                throw new Error("Risposta clustering non valida");
            }

            setData(data.map((d, i) => ({ ...d, cluster: result.clusters[i] })));
            alert("Clustering completato!");
        } catch (err) {
            alert("Errore clustering: " + err.message);
            console.error(err);
        }
    }

    async function doInjuryPrediction() {
        if (data.length === 0) return alert("Nessun dato disponibile per previsione");

        try {
            const payload = data.map(({ minutes_played, shots, assists, errors, match_rating }) => ({
                minutes_played,
                shots,
                assists,
                errors,
                match_rating,
            }));

            const res = await fetch("http://127.0.0.1:8000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());

            const result = await res.json();
            if (!result.risks || result.risks.length !== data.length) {
                throw new Error("Risposta previsione non valida");
            }

            setData(data.map((d, i) => ({ ...d, injury_risk: result.risks[i] })));
            alert("Previsione completata!");
        } catch (err) {
            alert("Errore previsione: " + err.message);
            console.error(err);
        }
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "auto", padding: "1rem" }}>
            <h2>Inserisci dati partita</h2>
            <form onSubmit={addRecord} style={{ marginBottom: "1rem" }}>
                <input type="text" placeholder="Match ID" value={form.match_id}
                    onChange={(e) => setForm({ ...form, match_id: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "100px" }} />

                <select value={form.player_name}
                    onChange={(e) => setForm({ ...form, player_name: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "160px" }}>
                    <option value="">Seleziona Giocatore</option>
                    {players.map((name, i) => <option key={i} value={name}>{name}</option>)}
                </select>

                <input type="number" placeholder="Minuti" value={form.minutes_played}
                    onChange={(e) => setForm({ ...form, minutes_played: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "80px" }} />

                <input type="number" placeholder="Tiri" value={form.shots}
                    onChange={(e) => setForm({ ...form, shots: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "60px" }} />

                <input type="number" placeholder="Assist" value={form.assists}
                    onChange={(e) => setForm({ ...form, assists: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "60px" }} />

                <input type="number" placeholder="Errori" value={form.errors}
                    onChange={(e) => setForm({ ...form, errors: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "60px" }} />

                <input type="number" step="0.1" placeholder="Voto" value={form.match_rating}
                    onChange={(e) => setForm({ ...form, match_rating: e.target.value })}
                    required style={{ marginRight: "0.5rem", width: "60px" }} />

                <button type="submit">Aggiungi</button>
            </form>

            {loading ? <p>Caricamento dati...</p> : (
                <>
                    <button onClick={doBasicAnalysis} style={{ marginRight: "1rem" }}>Analisi Statistica</button>
                    <button onClick={doClustering}>Clustering</button>
                    <button onClick={doInjuryPrediction} style={{ marginLeft: "1rem" }}>Previsione Infortunio</button>

                    <table border="1" cellPadding="5" style={{ width: "100%", marginTop: "1rem", textAlign: "left" }}>
                        <thead>
                            <tr>
                                <th>Match ID</th>
                                <th>Giocatore</th>
                                <th>Minuti</th>
                                <th>Tiri</th>
                                <th>Assist</th>
                                <th>Errori</th>
                                <th>Voto</th>
                                <th>Cluster</th>
                                <th>Rischio Infortunio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.match_id}</td>
                                    <td>{row.player_name}</td>
                                    <td>{row.minutes_played}</td>
                                    <td>{row.shots}</td>
                                    <td>{row.assists}</td>
                                    <td>{row.errors}</td>
                                    <td>{row.match_rating}</td>
                                    <td>{row.cluster !== undefined ? row.cluster : "-"}</td>
                                    <td>{row.injury_risk !== undefined ? row.injury_risk : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {analysis && (
                        <div style={{ marginTop: "2rem" }}>
                            <h3>Analisi Statistica Media</h3>
                            <ul>
                                <li>Minuti giocati medi: {analysis.avgMinutes.toFixed(1)}</li>
                                <li>Tiri medi: {analysis.avgShots.toFixed(1)}</li>
                                <li>Assist medi: {analysis.avgAssists.toFixed(1)}</li>
                                <li>Errori medi: {analysis.avgErrors.toFixed(1)}</li>
                                <li>Voto medio: {analysis.avgRating.toFixed(2)}</li>
                            </ul>

                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { name: "Media", ...analysis }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="avgMinutes" fill="#8884d8" name="Minuti" />
                                    <Bar dataKey="avgShots" fill="#82ca9d" name="Tiri" />
                                    <Bar dataKey="avgAssists" fill="#ffc658" name="Assist" />
                                    <Bar dataKey="avgErrors" fill="#ff8042" name="Errori" />
                                    <Bar dataKey="avgRating" fill="#8dd1e1" name="Voto" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
