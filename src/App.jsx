import { AuthProvider } from "./contexts/AuthContext.jsx";
import AppRoutes from "./routes/appRoutes.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" autoClose={4000} />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
