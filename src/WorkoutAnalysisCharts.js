import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function WorkoutAnalysisCharts() {
    const [players, setPlayers] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [selectedExercise, setSelectedExercise] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Stati per gli alert di miglioramento/peggioramento
    const [alerts, setAlerts] = useState({
        volume: "",
        strength: "",
        power: "",
    });

    useEffect(() => {
        async function fetchPlayers() {
            const { data, error } = await supabase.from("Players").select("Name");
            if (error) {
                setErrorMsg("Errore nel caricamento dei giocatori.");
                return;
            }
            setPlayers(data || []);
        }
        fetchPlayers();
    }, []);

    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase.from("exercise").select("Name");
            if (error) {
                setErrorMsg("Errore nel caricamento degli esercizi.");
                return;
            }
            setExercises(data || []);
        }
        fetchExercises();
    }, []);

    useEffect(() => {
        if (selectedPlayer && selectedExercise) {
            fetchWorkoutData();
        } else {
            setData([]);
            setErrorMsg("");
            setAlerts({ volume: "", strength: "", power: "" });
        }
    }, [selectedPlayer, selectedExercise]);

    const fetchWorkoutData = async () => {
        setLoading(true);
        setErrorMsg("");
        setAlerts({ volume: "", strength: "", power: "" });

        try {
            const { data: exerciseData, error: exError } = await supabase
                .from("exercise")
                .select("id")
                .eq("Name", selectedExercise)
                .single();

            if (exError || !exerciseData) {
                setErrorMsg("Esercizio non trovato.");
                setData([]);
                setLoading(false);
                return;
            }
            const exerciseId = exerciseData.id;

            const { data: results, error } = await supabase
                .from("workout_result")
                .select("player_name, date, sets, reps, weight, exercise_id")
                .eq("player_name", selectedPlayer)
                .eq("exercise_id", exerciseId);

            if (error) {
                setErrorMsg("Errore nel caricamento dei risultati.");
                setData([]);
                setLoading(false);
                return;
            }

            if (!results || results.length === 0) {
                setErrorMsg("Nessun dato trovato per questa combinazione.");
                setData([]);
                setLoading(false);
                return;
            }

            const transformed = results
                .map(entry => {
                    const volume = (entry.sets || 0) * (entry.reps || 0) * (entry.weight || 0);
                    const estimatedTime = (entry.reps || 0) * 3; // 3 sec per rep stimato
                    const power = estimatedTime > 0 ? ((entry.weight || 0) * (entry.reps || 0)) / estimatedTime : 0;
                    const strength = entry.weight || 0;

                    const dateFormatted = new Date(entry.date).toLocaleDateString("it-IT");

                    return {
                        date: dateFormatted,
                        volume: Math.round(volume * 10) / 10,
                        power: Math.round(power * 10) / 10,
                        strength: Math.round(strength * 10) / 10,
                    };
                })
                .sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));

            setData(transformed);

            // Calcolo alert miglioramento/peggioramento usando l'ultimo e penultimo dato
            if (transformed.length >= 2) {
                const last = transformed[transformed.length - 1];
                const prev = transformed[transformed.length - 2];

                function getAlert(current, previous) {
                    if (current > previous) return "Miglioramento";
                    if (current < previous) return "Peggioramento";
                    return "Stabile";
                }

                setAlerts({
                    volume: getAlert(last.volume, prev.volume),
                    strength: getAlert(last.strength, prev.strength),
                    power: getAlert(last.power, prev.power),
                });
            } else {
                setAlerts({
                    volume: "",
                    strength: "",
                    power: "",
                });
            }
        } catch (error) {
            setErrorMsg("Errore imprevisto: " + error.message);
            setData([]);
            setAlerts({ volume: "", strength: "", power: "" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Workout Analysis</h2>

            <div style={{ marginBottom: "1rem" }}>
                <label>
                    Giocatore:&nbsp;
                    <select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                    >
                        <option value="">-- Seleziona Giocatore --</option>
                        {players.map((p) => (
                            <option key={p.Name} value={p.Name}>{p.Name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>
                    Esercizio:&nbsp;
                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        disabled={!selectedPlayer}
                    >
                        <option value="">-- Seleziona Esercizio --</option>
                        {exercises.map((e) => (
                            <option key={e.Name} value={e.Name}>{e.Name}</option>
                        ))}
                    </select>
                </label>
            </div>

            {loading && <p>Caricamento dati...</p>}
            {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

            {!loading && data.length > 0 && (
                <>
                    <h3>Volume <small>({alerts.volume})</small></h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="volume"
                                stroke="#8884d8"
                                name="Volume"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <h3>Forza <small>({alerts.strength})</small></h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="strength"
                                stroke="#82ca9d"
                                name="Forza (kg)"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <h3>Potenza <small>({alerts.power})</small></h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <CartesianGrid stroke="#ccc" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="power"
                                stroke="#ff7300"
                                name="Potenza"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
}

export default WorkoutAnalysisCharts;
