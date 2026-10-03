import { AuthProvider } from "./contexts/AuthContext.jsx";
import AppRoutes from "./routes/appRoutes.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";
import { ErrorBoundary } from "./services/monitoring.js";

function Fallback() {
  return (
    <div role="alert" style={{ padding: 32, textAlign: "center" }}>
      <h1>Algo deu errado</h1>
      <p>O erro foi registrado. Recarregue a página para continuar.</p>
      <button onClick={() => window.location.reload()}>Recarregar</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary fallback={<Fallback />}>
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={4000} style={{ zIndex: 99999 }} />
      <AppRoutes />
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
