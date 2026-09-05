import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./routes";
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;