import { Routes, Route, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { MainScreen } from './components/MainScreen';
import { HistoryTab } from './components/HistoryTab';
import { ProgressTab } from './components/ProgressTab';
import { ThemeToggle } from './components/ThemeToggle';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { DistortionReference } from './components/DistortionReference';
import { StatusPage } from './components/StatusPage';
import { StudioScreen } from './components/v2/StudioScreen';
import { RecordingProvider } from './contexts/RecordingContext';
import { SessionProvider } from './contexts/SessionContext';

function AppShell() {
  const location = useLocation();
  const hideTabBar = location.pathname === '/studio';

  return (
    <div className={hideTabBar ? 'app app--studio' : 'app'}>
      <OnboardingOverlay />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/history" element={<HistoryTab />} />
        <Route path="/progress" element={<ProgressTab />} />
        <Route path="/distortions" element={<DistortionReference />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/studio" element={<StudioScreen />} />
      </Routes>
      {!hideTabBar && <TabBar />}
    </div>
  );
}

function App() {
  return (
    <RecordingProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </RecordingProvider>
  );
}

export default App;
