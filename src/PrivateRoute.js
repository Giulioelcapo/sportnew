import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  console.log("Token in PrivateRoute:", token); // per debug

  // Se non c'è il token, rimanda al login
  if (!token || token === "null" || token === "undefined") {
    return <Navigate to="/login" replace />;
  }

  // Altrimenti, mostra i contenuti protetti
  return children;
}
