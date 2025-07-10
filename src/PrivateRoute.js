import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  console.log("Token in PrivateRoute:", token);  // per debug
  return token ? children : <Navigate to="/login" replace />;
}
