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
import { PrivacyPage } from './components/PrivacyPage';
import { RecordingProvider } from './contexts/RecordingContext';
import { SessionProvider } from './contexts/SessionContext';
import { useDailyReminder } from './hooks/useDailyReminder';

function AppShell() {
  const location = useLocation();
  const hideTabBar = location.pathname === '/studio' || location.pathname === '/privacy';
  useDailyReminder();

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
        <Route path="/privacy" element={<PrivacyPage />} />
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
