import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
    FaHome, FaRunning, FaChartLine, FaUsers,
    FaEye, FaUsersCog, FaCalendarAlt, FaCog,
    FaUser, FaSignOutAlt, FaBars, FaClipboardCheck, FaTimes, FaVideo
} from "react-icons/fa";
import { FaBandAid } from "react-icons/fa";
import { MdAnalytics } from "react-icons/md";

const supabase = createClient(
    "https://efzgpbneonewotqxozau.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmemdwYm5lb25ld290cXhvemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMTc5NDIsImV4cCI6MjA2MzY5Mzk0Mn0.nTGx7dLuieQqA_AKhlTncUtCPWA2I0tWq1qAJEmu8sg"
);

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [players, setPlayers] = useState([]);
    const [redirectDone, setRedirectDone] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (redirectDone) return;
        const lastVisitedPlayerRoute = localStorage.getItem("lastVisitedPlayerRoute");
        if (lastVisitedPlayerRoute && location.pathname === "/") {
            setRedirectDone(true);
            navigate(lastVisitedPlayerRoute);
        }
    }, [location.pathname, navigate, redirectDone]);

    useEffect(() => {
        async function loadPlayers() {
            const { data, error } = await supabase.from("Players").select("Name").order("Name");
            if (!error && Array.isArray(data)) setPlayers(data);
            else console.error("Errore caricamento players:", error);
        }
        loadPlayers();
    }, []);

    const menuItems = [
        { to: "/", label: "Home", icon: <FaHome /> },
        { to: "/performance-ssg", label: "Performance SSG", icon: <FaRunning /> },
        { to: "/acwr", label: "ACWR", icon: <FaChartLine /> },
        { to: null, label: "Players", icon: <FaUsers />, hasDropdown: true },
        { to: "/monitoring", label: "Monitoring", icon: <FaEye /> },
        { to: "/Infortuni", label: "Infortuni", icon: <FaBandAid /> },
        { to: "/calendar", label: "Calendar", icon: <FaCalendarAlt /> },
        { to: "/setting", label: "Setting", icon: <FaCog /> },
        { to: "/profile", label: "Profile", icon: <FaUser /> },
        { to: "/statistiche", label: "Statistiche squadra", icon: <FaUsersCog /> },
        { to: "/video-analysis", label: "Video analysis", icon: <FaVideo /> },
        { to: "/Evaluation", label: "Evaluation", icon: <FaClipboardCheck /> },
        { to: "/WorkoutAnalysisCharts", label: "Workout Analysis", icon: <MdAnalytics /> },
        { to: "/login", label: "Login", icon: <FaSignOutAlt /> },
        { to: "/logout", label: "Logout", icon: <FaSignOutAlt /> }, // corretto "loout" in "logout"
    ];

    const onLinkClick = (path) => {
        if (path === "/") setRedirectDone(true);
        setSidebarOpen(false);
    };

    return (
        <>
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="hamburger-btn"
                    style={{
                        position: "fixed", top: 10, left: 10, padding: "6px 12px",
                        fontSize: 24, backgroundColor: "#004080", color: "white",
                        border: "none", borderRadius: 4, boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                        zIndex: 1001
                    }}
                    aria-label="Apri sidebar"
                >
                    <FaBars />
                </button>
            )}

            <div style={{ display: "flex", height: "100vh", fontFamily: "Arial", overflow: "hidden" }}>
                <div
                    style={{
                        width: sidebarOpen ? 250 : 0,
                        backgroundColor: "#004080",
                        color: "white",
                        transition: "width 0.3s",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        position: "fixed",
                        top: 0, left: 0, height: "100vh",
                        zIndex: 1000,
                    }}
                    className="sidebar"
                >
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            style={{ background: "none", border: "none", color: "white", fontSize: 24 }}
                            aria-label="Chiudi sidebar"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <nav style={{ flex: 1, overflowY: "auto" }}>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {menuItems.map((item) => item.hasDropdown ? (
                                <li key="players-dropdown">
                                    <div
                                        onClick={() => setOpenDropdown(!openDropdown)}
                                        style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", cursor: "pointer" }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <span style={{ marginRight: 12 }}>{item.icon}</span>{item.label}
                                        </div>
                                        <span>{openDropdown ? "▲" : "▼"}</span>
                                    </div>
                                    {openDropdown && (
                                        <div style={{ maxHeight: 300, overflowY: "auto", paddingLeft: 30 }}>
                                            <ul style={{ listStyle: "none", padding: 0 }}>
                                                {players.map((p) => {
                                                    const encodedName = encodeURIComponent(p.Name);
                                                    const path = `/Players/${encodedName}`;
                                                    return (
                                                        <li key={p.Name}>
                                                            <Link
                                                                to={path}
                                                                onClick={() => {
                                                                    localStorage.setItem("lastVisitedPlayerRoute", path);
                                                                    setRedirectDone(false);
                                                                    setSidebarOpen(false);
                                                                }}
                                                                style={{
                                                                    display: "block",
                                                                    color: location.pathname === path ? "#ffd700" : "white",
                                                                    textDecoration: "none",
                                                                    padding: "8px 0",
                                                                }}
                                                            >
                                                                {p.Name}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                            ) : (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        style={{
                                            display: "flex", alignItems: "center",
                                            color: location.pathname === item.to ? "#ffd700" : "white",
                                            textDecoration: "none", padding: "12px 20px",
                                            borderLeft: location.pathname === item.to ? "4px solid #ffd700" : "4px solid transparent"
                                        }}
                                        onClick={() => onLinkClick(item.to)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        <span style={{ marginRight: 12 }}>{item.icon}</span>{item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div style={{ flex: 1, marginLeft: sidebarOpen ? 250 : 0, transition: "margin-left 0.3s", overflow: "auto" }}>
                    <Outlet />
                </div>
            </div>
        </>
    );
}
