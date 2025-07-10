
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid, Bar, BarChart,
} from "recharts";

// Inizializza Supabase
const supabase = createClient(
    "https://efzgpbneonewotqxozau.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg"
);

// Calcolo delle metriche
function calculateStats(results) {
    const sets = [1, 2, 3, 4, 5, 6].map((n) => Number(results[`result_${n}`]));
    const N = sets.length;
    const sum = sets.reduce((a, b) => a + b, 0);
    const average = sum / N;
    const max = Math.max(...sets);
    const min = Math.min(...sets);
    const variance = sets.reduce((acc, val) => acc + (val - average) ** 2, 0) / N;
    const stdDev = Math.sqrt(variance);

    const deltas = [];
    for (let i = 1; i < N; i++) {
        deltas.push(sets[i] - sets[i - 1]);
    }
    const deltaTotal = sets[N - 1] - sets[0];
    const percentChanges = deltas.map((delta, i) =>
        sets[i] !== 0 ? (delta / sets[i]) * 100 : 0
    );
    const fatigueRaw =
        sets[0] > 0 ? ((sets[5] - sets[0]) / sets[0]) * 100 : 0;
    const fatiguePercent = Number(fatigueRaw.toFixed(1));
    const IR = (min / max) * 120;
    const ICP = deltas.filter((d) => d < 0).reduce((acc, val) => acc + val, 0);
    const outOfRangeSets = sets.filter(
        (s) => s > average * 1.2 || s < average * 0.8
    );
    const isInconsistent = stdDev > average * 0.25;

    let classification = "Media Resistenza";
    if (isInconsistent || Math.max(...deltas.map(Math.abs)) > 25) {
        classification = "Incoerente";
    } else if (fatiguePercent < 8) {
        classification = "Buona Resistenza";
    } else if (fatiguePercent > 20) {
        classification = "Bassa Resistenza";
    }

    return {
        sets,
        average,
        max,
        min,
        stdDev,
        sum,
        deltas,
        deltaTotal,
        percentChanges,
        fatiguePercent,
        IR,
        ICP,
        outOfRangeSets,
        isInconsistent,
        classification,
    };
}

// Colori per badge classificazione
const classificationColors = {
    "Buona Resistenza": "bg-green-500 text-white",
    "Media Resistenza": "bg-yellow-400 text-black",
    "Bassa Resistenza": "bg-red-500 text-white",
    "Incoerente": "bg-gray-700 text-white",
};

export default function ResistanceTestViewer() {
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState("");
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [results, setResults] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        async function loadPlayers() {
            const { data, error } = await supabase.from("Players").select("Name");
            if (error) {
                console.error(error);
                return;
            }
            const uniqueNames = [...new Set(data.map((row) => row.Name))];
            setPlayers(uniqueNames);
        }
        loadPlayers();
    }, []);

    useEffect(() => {
        if (!selectedPlayer) return;
        async function loadDates() {
            const { data, error } = await supabase
                .from("ResistanceTest")
                .select("date")
                .eq("Name", selectedPlayer);
            if (error) {
                console.error(error);
                return;
            }
            const uniqueDates = [...new Set(data.map((row) => row.date))];
            setDates(uniqueDates);
        }
        loadDates();
        setSelectedDate("");
        setResults(null);
        setStats(null);
    }, [selectedPlayer]);

    useEffect(() => {
        if (!selectedPlayer || !selectedDate) return;
        async function loadResults() {
            const { data, error } = await supabase
                .from("ResistanceTest")
                .select("result_1, result_2, result_3, result_4, result_5, result_6")
                .eq("Name", selectedPlayer)
                .eq("date", selectedDate)
                .single();
            if (error) {
                console.error(error);
                return;
            }
            setResults(data);
            setStats(calculateStats(data));
        }
        loadResults();
    }, [selectedDate]);

    if (!results || !stats) {
        return (
            <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-md mt-10">
                <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
                    Visualizza Test di Resistenza
                </h2>
                <div className="mb-5">
                    <label className="block font-medium mb-1">Giocatore:</label>
                    <select
                        value={selectedPlayer}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">-- Seleziona un giocatore --</option>
                        {players.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedPlayer && (
                    <div className="mb-5">
                        <label className="block font-medium mb-1">Data:</label>
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Seleziona una data --</option>
                            {dates.map((d) => (
                                <option key={d} value={d}>
                                    {new Date(d).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">
                Visualizza Test di Resistenza
            </h2>

            {/* Statistiche */}
            <section className="mb-8 p-4 border rounded-lg bg-indigo-50 shadow-inner">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-2">📊 Statistiche di base</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Media: <strong>{stats.average.toFixed(2)}</strong></li>
                    <li>Massimo: <strong>{stats.max}</strong></li>
                    <li>Minimo: <strong>{stats.min}</strong></li>
                    <li>Deviazione standard: <strong>{stats.stdDev.toFixed(2)}</strong></li>
                    <li>Fatigue Percent: <strong>{stats.fatiguePercent}%</strong></li>
                    <li>IR: <strong>{stats.IR.toFixed(2)}</strong></li>
                    <li>ICP: <strong>{stats.ICP.toFixed(2)}</strong></li>
                    <li>
                        Classificazione:
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${classificationColors[stats.classification] || "bg-gray-300 text-black"}`}>
                            {stats.classification}
                        </span>
                    </li>
                </ul>
            </section>

            {/* Grafico Lineare */}
            <section className="mb-8">
                <h3 className="font-semibold text-xl mb-3">📈 Trend risultati</h3>
                <LineChart width={320} height={240} data={stats.sets.map((value, index) => ({ name: `Set ${index + 1}`, value }))}>
                    <CartesianGrid stroke="#ccc" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
            </section>
            {/* Grafico a barre delle variazioni (deltas) */}
            <section className="mb-8">
                <h3 className="font-semibold text-xl mb-3">📉 Variazioni tra i set (Delta)</h3>
                <BarChart
                    width={320}
                    height={240}
                    data={stats.deltas.map((val, i) => ({ name: `Δ Set ${i + 1}-${i + 2}`, value: val }))}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" />
                </BarChart>
            </section>

        </div>
    );
}
