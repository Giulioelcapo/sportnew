import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// Supabase setup
const supabaseUrl = "https://efzgpbneonewotqxozau.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg'; // Nascondilo in produzione
const supabase = createClient(supabaseUrl, supabaseKey);

// Posizioni sulla mini field
const positionMap = {
  GK: { top: "10%", left: "50%" },
  CB: { top: "45%", left: "35%" },
  LB: { top: "60%", left: "20%" },
  RB: { top: "70%", left: "75%" },
  CM: { top: "80%", left: "50%" },
  CAM: { top: "55%", left: "50%" },
  LW: { top: "35%", left: "15%" },
  RW: { top: "35%", left: "85%" },
  YM: { top: "65%", left: "85%" },
  YF: { top: "55%", left: "85%" },
  ST: { top: "20%", left: "50%" },
  CF: { top: "35%", left: "50%" },
};

export default function PlayerDetail() {
  const { name } = useParams();
  const [playerData, setPlayerData] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fitnessData, setFitnessData] = useState(null);
  const [injuries, setInjuries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("");

  useEffect(() => {
    async function fetchPlayerData() {
      setLoading(true);
      setNotFound(false);
      if (!name || typeof name !== "string") {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const cleanName = name.trim().toLowerCase();
      try {
        const { data: stats } = await supabase.from("Minuti giocati").select("Name, minutes_played, games_played, Goal");
        const foundPlayer = stats.find((p) => p.Name?.trim().toLowerCase() === cleanName);
        if (!foundPlayer) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPlayerData(foundPlayer);

        const { data: roles } = await supabase.from("Position").select("Name, Position");
        setRoleData(roles.find((r) => r.Name?.trim().toLowerCase() === cleanName) || null);

        const { data: allPlayers } = await supabase.from("Players").select("Name");
        setPlayers(allPlayers || []);

        const { data: testData } = await supabase.from("Test").select("Name, sprint_10m, sprint_30m, SJ, CMJ, date");
        setFitnessData(testData.find((t) => t.Name?.trim().toLowerCase() === cleanName) || null);

        const { data: injuryData } = await supabase.from("Injury").select("date, Body_part, Injury_type, Severety, Name");
        setInjuries(injuryData.filter((inj) => inj.Name?.trim().toLowerCase() === cleanName));
      } catch (error) {
        console.error("Errore:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayerData();
  }, [name]);

  if (loading) return <p>Caricamento...</p>;
  if (notFound) return <main style={{ padding: "2rem" }}><h2 style={{ color: "red" }}>⚠️ Player "{name}" not found.</h2></main>;

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Player Overview</h1>
          <div style={{ position: "relative" }}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}>Select players ▼</button>
            {dropdownOpen && (
              <ul style={{
                position: "absolute", right: 0, backgroundColor: "#fff", border: "1px solid #ccc",
                maxHeight: "200px", overflowY: "auto", listStyle: "none", padding: 0, margin: 0, zIndex: 10
              }}>
                <button
                  style={{ marginLeft: "1rem", padding: "0.5rem", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}
                  onClick={() => setShowModal(true)}
                >
                  ➕ Add New
                </button>
                {players.map((p) => (
                  <li key={p?.Name}>
                    <Link
                      to={`/Players/${encodeURIComponent(p?.Name || "")}`}
                      style={{ display: "block", padding: "0.5rem", textDecoration: "none", color: "#333" }}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {p?.Name || "Nome non disponibile"}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <img src="/images/logo.png" alt="logo" style={{ height: "200px", objectFit: "contain" }} />
      </div>

      <h2>{playerData?.Name}</h2>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <StatCard title="Minutes" value={playerData?.minutes_played} bgColor="#d4edda" />
        <StatCard title="Games" value={playerData?.games_played} bgColor="#d1ecf1" />
        <StatCard title="Goals" value={playerData?.Goal} bgColor="#f8d7da" />
      </div>

      <div style={{
        marginTop: "2rem", width: "300px", padding: "1rem", backgroundColor: "#f9f9f9",
        borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center", fontWeight: "600", fontSize: "1.1rem"
      }}>
        Position: {roleData?.Position ?? "-"}
      </div>

      <div style={{
        position: "relative", width: "150px", height: "90px", marginTop: "1rem",
        backgroundImage: "url('/images/field.png')", backgroundSize: "cover", borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
      }}>
        {roleData?.Position && (
          <div style={{
            position: "absolute", width: "20px", height: "20px", backgroundColor: "white",
            borderRadius: "50%", transform: "translate(-50%, -50%)",
            top: positionMap[roleData.Position]?.top || "50%",
            left: positionMap[roleData.Position]?.left || "50%"
          }} />
        )}
      </div>

      <section style={{ marginTop: "3rem" }}>
        <h3>🏃‍♂️ Fitness Test</h3>
        {fitnessData ? (
          <div style={{
            overflowX: "auto", backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", padding: "1rem"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
              <thead>
                <tr style={{ backgroundColor: "#f2f2f2" }}>
                  <th style={cellHeader}>Sprint 10m</th>
                  <th style={cellHeader}>Sprint 30m</th>
                  <th style={cellHeader}>SJ</th>
                  <th style={cellHeader}>CMJ</th>
                  <th style={cellHeader}>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cell}>{fitnessData.sprint_10m ?? "-"}</td>
                  <td style={cell}>{fitnessData.sprint_30m ?? "-"}</td>
                  <td style={cell}>{fitnessData.SJ ?? "-"}</td>
                  <td style={cell}>{fitnessData.CMJ ?? "-"}</td>
                  <td style={cell}>{fitnessData.date ?? "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : <p>No fitness test data available.</p>}
      </section>

      <section style={{ marginTop: "3rem" }}>
        <h3>🩹 Injury History</h3>
        {injuries.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {injuries.map((inj, i) => (
              <div key={i} style={{
                padding: "1rem", backgroundColor: "#fff", borderRadius: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)", lineHeight: "1.4"
              }}>
                <strong>{inj.Body_part}</strong><br />
                Injury: {inj.Injury_type}<br />
                Severity: {inj.Severety}<br />
                Date: {inj.date}
              </div>
            ))}
          </div>
        ) : <p>No injury data available.</p>}
      </section>

      {showModal && (
        <AddPlayerModal
          onClose={() => setShowModal(false)}
          onAdd={async () => {
            if (newName.trim() === "" || newPosition.trim() === "") {
              alert("Please enter a name and position");
              return;
            }
            await supabase.from("Players").insert([{ Name: newName.trim() }]);
            await supabase.from("Position").insert([{ Name: newName.trim(), Position: newPosition.trim() }]);
            setNewName("");
            setNewPosition("");
            setShowModal(false);
            // Optionally refresh players list
            const { data: allPlayers } = await supabase.from("Players").select("Name");
            setPlayers(allPlayers || []);
          }}
          newName={newName}
          setNewName={setNewName}
          newPosition={newPosition}
          setNewPosition={setNewPosition}
        />
      )}
    </main>
  );
}

const cellHeader = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  backgroundColor: "#eee",
};

const cell = {
  padding: "8px",
  borderBottom: "1px solid #ddd",
};

// Component for statistic cards
function StatCard({ title, value, bgColor }) {
  return (
    <div style={{
      backgroundColor: bgColor,
      borderRadius: "10px",
      padding: "1rem 2rem",
      textAlign: "center",
      fontWeight: "600",
      fontSize: "1.25rem",
      width: "120px"
    }}>
      <div>{title}</div>
      <div>{value ?? "-"}</div>
    </div>
  );
}

function AddPlayerModal({ onClose, onAdd, newName, setNewName, newPosition, setNewPosition }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: "10px", padding: "2rem",
        width: "300px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}>
        <h3>Add New Player</h3>
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <input
          type="text"
          placeholder="Position"
          value={newPosition}
          onChange={(e) => setNewPosition(e.target.value)}
          style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <button onClick={onAdd} style={{ marginRight: "1rem" }}>Add</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

