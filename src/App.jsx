import { AuthProvider } from "./contexts/AuthContext.jsx";
import AppRoutes from "./routes/appRoutes.jsx";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
