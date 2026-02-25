import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes/appRoutes";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
