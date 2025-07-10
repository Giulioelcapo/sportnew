import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    const { data, error } = await supabase
      .from("Login")
      .select("*")
      .eq("email", emailTrimmed)
      .single();

    if (error || !data) {
      alert("Email errata o utente non trovato");
      return;
    }

    if (data.password !== passwordTrimmed) {
      alert("Password errata");
      return;
    }

    // Salvo il token (o id utente) nel localStorage con chiave "token"
    localStorage.setItem("token", data.id);
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <div style={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" style={styles.loginButton}>
          Login
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  form: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 8,
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    width: 320,
    display: "flex",
    flexDirection: "column",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    padding: 12,
    fontSize: 16,
    borderRadius: 4,
    border: "1px solid #ccc",
    outline: "none",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: 15,
  },
  eyeButton: {
    position: "absolute",
    top: "50%",
    right: 10,
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    padding: 0,
  },
  loginButton: {
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 16,
  },
};
