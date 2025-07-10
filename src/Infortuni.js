import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { FaExclamationTriangle } from "react-icons/fa";

const supabase = createClient(
    "https://efzgpbneonewotqxozau.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg"
);

function calcolaRischio(data, workloadData, recentInjuryCount, totalInjuryCount) {
    if (!data) return 0;

    const { sleep_hours, food_and_drink, stress, soreness_muscle, soreness_joint } = data;

    const sonnoScore = 1 - Math.min(Math.abs(sleep_hours - 8) / 8, 1);
    const foodScore = Math.min(food_and_drink / 10, 1);
    const stressScore = 1 - Math.min(stress / 10, 1);
    const muscleScore = 1 - Math.min(soreness_muscle / 10, 1);
    const jointScore = 1 - Math.min(soreness_joint / 10, 1);

    const workloadScore = workloadData ? Math.min((workloadData.RPE * workloadData.duration) / 100, 1) : 0;
    const dailyLoadScore = workloadData ? Math.min(workloadData.daily_load / 100, 1) : 0;
    const weeklyLoadScore = workloadData ? Math.min(workloadData.weekly_load / 500, 1) : 0;
    const ACWRScore = workloadData ? workloadData.ACWR : 1;

    const acwrPenalty = ACWRScore > 1.5 ? Math.min((ACWRScore - 1.5) * 0.3, 0.15) : 0;

    const injuryScore = Math.min(recentInjuryCount / 5, 1);
    const chronicInjuryFactor = Math.min(totalInjuryCount / 20, 1);

    const weightedSum =
        sonnoScore * 0.15 +
        foodScore * 0.1 +
        stressScore * 0.15 +
        muscleScore * 0.1 +
        jointScore * 0.1 +
        (1 - workloadScore) * 0.15 +
        (1 - dailyLoadScore) * 0.05 +
        (1 - weeklyLoadScore) * 0.05 +
        (1 - ACWRScore) * 0.1 +
        (1 - injuryScore) * 0.05;

    let risk = (1 - weightedSum) * 100;
    risk += chronicInjuryFactor * 5;

    return Math.round(Math.min(risk, 100));
}

export default function InfortuniModule() {
    const [players, setPlayers] = useState([]);
    const [monitoringData, setMonitoringData] = useState([]);
    const [workload, setWorkload] = useState([]);
    const [infortuni, setInfortuni] = useState([]);
    const [rischi, setRischi] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                const { data: playersData, error: errP } = await supabase.from("Players").select("id, Name");
                if (errP) throw errP;
                setPlayers(playersData);

                const { data: monitoring, error: errM } = await supabase
                    .from("MonitoringData")
                    .select("name, sleep_hours, food_and_drink, stress, soreness_muscle, soreness_joint");
                if (errM) throw errM;
                setMonitoringData(monitoring);

                const { data: workloadData, error: errW } = await supabase
                    .from("workloads")
                    .select("name, RPE, duration, daily_load, weekly_load, ACWR");
                if (errW) throw errW;
                setWorkload(workloadData);

                const { data: injuriesData, error: errI } = await supabase
                    .from("Injury")
                    .select("id, Name, Severety, description, created_at");
                if (errI) throw errI;
                setInfortuni(injuriesData);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (players.length === 0 || monitoringData.length === 0) return;

        const now = new Date();

        const rischiCalcolati = players.map((p) => {
            const d = monitoringData.find((m) => m.name === p.Name);
            const w = workload.find((w) => w.name === p.Name);

            const recentInjuries = infortuni.filter(
                (inf) => inf.Name === p.Name && new Date(inf.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            );
            const totalInjuries = infortuni.filter((inf) => inf.Name === p.Name);

            const recentCount = recentInjuries.length;
            const totalCount = totalInjuries.length;

            if (!d) return { name: p.Name, rischio: 0 };

            return {
                name: p.Name,
                rischio: calcolaRischio(d, w, recentCount, totalCount),
            };
        });

        rischiCalcolati.sort((a, b) => b.rischio - a.rischio);

        if (selectedPlayer) {
            const selectedRisk = rischiCalcolati.find((r) => r.name === selectedPlayer);
            setRischi(selectedRisk ? [selectedRisk] : []);
        } else {
            setRischi(rischiCalcolati);
        }
    }, [players, monitoringData, workload, infortuni, selectedPlayer]);

    function coloreRischio(r) {
        if (r < 30) return "#28a745";
        if (r < 60) return "#ffc107";
        return "#dc3545";
    }

    const topInfortuni = [...infortuni].sort((a, b) => b.Severety - a.Severety).slice(0, 3);

    const selectedMonitoring = monitoringData.find((m) => m.name === selectedPlayer);
    const selectedWorkload = workload.find((w) => w.name === selectedPlayer);
    const selectedInjuries = infortuni.filter((inf) => inf.Name === selectedPlayer);

    return (
        <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
            <h2>Prevenzione Infortuni - Dashboard Innovativa</h2>
            {loading && <p>Caricamento dati...</p>}
            {error && <p style={{ color: "red" }}>Errore: {error}</p>}

            <section style={{ marginBottom: 30 }}>
                <h3>Seleziona Giocatore</h3>
                <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
                    <option value="">Tutti i giocatori</option>
                    {players.map((p) => (
                        <option key={p.id} value={p.Name}>
                            {p.Name}
                        </option>
                    ))}
                </select>
                {selectedPlayer && (
                    <button style={{ marginLeft: 10 }} onClick={() => setSelectedPlayer("")}>
                        Resetta selezione
                    </button>
                )}
            </section>

            <section style={{ marginBottom: 30 }}>
                <h3>Rischio Infortuni Giocatori</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {rischi.map(({ name, rischio }) => (
                        <li key={name} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    backgroundColor: coloreRischio(rischio),
                                    marginRight: 10,
                                }}
                            ></div>
                            <strong>{name}</strong> - Rischio: {rischio}%
                        </li>
                    ))}
                </ul>
            </section>

            {selectedPlayer && (
                <section style={{ marginBottom: 30 }}>
                    <h3>Dettagli Giocatore: {selectedPlayer}</h3>
                    {selectedMonitoring ? (
                        <div>
                            <p>
                                <strong>Dati Monitoring:</strong>
                            </p>
                            <ul>
                                <li>Sono ore di sonno: {selectedMonitoring.sleep_hours}</li>
                                <li>Alimentazione (score 0-10): {selectedMonitoring.food_and_drink}</li>
                                <li>Stress (0-10): {selectedMonitoring.stress}</li>
                                <li>Dolori muscolari (0-10): {selectedMonitoring.soreness_muscle}</li>
                                <li>Dolori articolari (0-10): {selectedMonitoring.soreness_joint}</li>
                            </ul>
                        </div>
                    ) : (
                        <p>Nessun dato di monitoring disponibile.</p>
                    )}

                    {selectedWorkload ? (
                        <div>
                            <p>
                                <strong>Workload:</strong>
                            </p>
                            <ul>
                                <li>RPE: {selectedWorkload.RPE}</li>
                                <li>Durata: {selectedWorkload.duration} minuti</li>
                                <li>Carico giornaliero: {selectedWorkload.daily_load}</li>
                                <li>Carico settimanale: {selectedWorkload.weekly_load}</li>
                                <li>ACWR: {selectedWorkload.ACWR}</li>
                            </ul>
                        </div>
                    ) : (
                        <p>Nessun dato di workload disponibile.</p>
                    )}

                    <div>
                        <p>
                            <strong>Infortuni recenti (ultimi 30 giorni):</strong>
                        </p>
                        {selectedInjuries.length === 0 && <p>Nessun infortunio registrato.</p>}
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {selectedInjuries
                                .filter(
                                    (inf) =>
                                        new Date(inf.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                )
                                .map(({ id, Severety, description }) => (
                                    <li
                                        key={id}
                                        style={{
                                            marginBottom: 10,
                                            padding: 10,
                                            backgroundColor: "#f8d7da",
                                            borderRadius: 6,
                                            color: "#721c24",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <FaExclamationTriangle style={{ marginRight: 10, fontSize: 24 }} />
                                        <div>
                                            Severità: {Severety} <br />
                                            {description}
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </section>
            )}

            <section>
                <h3>Top 3 Infortuni (Alert)</h3>
                {topInfortuni.length === 0 && <p>Nessun infortunio registrato.</p>}
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {topInfortuni.map(({ id, Name, Severety, description }) => (
                        <li
                            key={id}
                            style={{
                                marginBottom: 10,
                                padding: 10,
                                backgroundColor: "#f8d7da",
                                borderRadius: 6,
                                color: "#721c24",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <FaExclamationTriangle style={{ marginRight: 10, fontSize: 24 }} />
                            <div>
                                Giocatore: <strong>{Name}</strong> <br />
                                Severità: {Severety} <br />
                                {description}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
