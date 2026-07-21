import { Routes, Route } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { MainScreen } from './components/MainScreen';
import { HistoryTab } from './components/HistoryTab';
import { ProgressTab } from './components/ProgressTab';
import { ThemeToggle } from './components/ThemeToggle';
import { OnboardingOverlay } from './components/OnboardingOverlay';

function App() {
  return (
    <div className="app">
      <OnboardingOverlay />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/history" element={<HistoryTab />} />
        <Route path="/progress" element={<ProgressTab />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default App;
