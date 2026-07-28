import { Routes, Route } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { MainScreen } from './components/MainScreen';
import { HistoryTab } from './components/HistoryTab';
import { ProgressTab } from './components/ProgressTab';
import { ThemeToggle } from './components/ThemeToggle';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { DistortionReference } from './components/DistortionReference';
import { StatusPage } from './components/StatusPage';
import { RecordingProvider } from './contexts/RecordingContext';
import { SessionProvider } from './contexts/SessionContext';

function App() {
  return (
    <RecordingProvider>
    <SessionProvider>
    <div className="app">
      <OnboardingOverlay />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/history" element={<HistoryTab />} />
        <Route path="/progress" element={<ProgressTab />} />
        <Route path="/distortions" element={<DistortionReference />} />
        <Route path="/status" element={<StatusPage />} />
      </Routes>
      <TabBar />
    </div>
    </SessionProvider>
    </RecordingProvider>
  );
}

export default App;
