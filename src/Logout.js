import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Uscita in corso...");

  useEffect(() => {
    localStorage.removeItem("token");
    setMessage("Sei uscito. Verrai reindirizzato al login.");
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2000);
  }, [navigate]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>{message}</h2>
    </div>
  );
}
