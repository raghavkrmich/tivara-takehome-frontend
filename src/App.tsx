import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { UserForm } from './components/UserForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<UserForm />} />
        {/* Add other routes if needed */}
      </Routes>
    </Router>
  );
}

export default App;
