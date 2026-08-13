import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { DynastiesProvider } from "./context/DynastiesContext";
import { TableCacheProvider } from "./context/TableCacheContext";
import { LoginScreen } from "./components/LoginScreen";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { SeasonsPage } from "./pages/Seasons";
import { SeasonFormPage } from "./pages/SeasonForm";
import { SeasonDetailPage } from "./pages/SeasonDetail";
import { SeasonRecapPage } from "./pages/SeasonRecap";
import { GameFormPage } from "./pages/GameForm";
import { ScheduleSetupPage } from "./pages/ScheduleSetup";
import { RecruitsPage } from "./pages/Recruits";
import { RecruitFormPage } from "./pages/RecruitForm";
import { CareerPage } from "./pages/Career";
import { SettingsPage } from "./pages/Settings";
import { NationalLandscapePage } from "./pages/NationalLandscape";
import { NationalLandscapeFormPage } from "./pages/NationalLandscapeForm";

// Gates the whole app behind auth: signed-out visitors only ever see the
// login screen, so nobody can reach another user's data. The data providers
// (which read the signed-in uid) only mount once we have a user.
function Gate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="login-screen"><p className="muted">Loading...</p></div>;
  }
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <SettingsProvider>
      <DynastiesProvider>
        <TableCacheProvider>
          <HashRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/seasons" element={<SeasonsPage />} />
                <Route path="/seasons/new" element={<SeasonFormPage />} />
                <Route path="/seasons/:id" element={<SeasonDetailPage />} />
                <Route path="/seasons/:id/recap" element={<SeasonRecapPage />} />
                <Route path="/seasons/:id/edit" element={<SeasonFormPage />} />
                <Route path="/seasons/:seasonId/schedule" element={<ScheduleSetupPage />} />
                <Route path="/seasons/:seasonId/games/new" element={<GameFormPage />} />
                <Route path="/seasons/:seasonId/games/:gameId" element={<GameFormPage />} />
                <Route path="/recruits" element={<RecruitsPage />} />
                <Route path="/recruits/new" element={<RecruitFormPage />} />
                <Route path="/recruits/:id" element={<RecruitFormPage />} />
                <Route path="/career" element={<CareerPage />} />
                <Route path="/landscape" element={<NationalLandscapePage />} />
                <Route path="/landscape/new" element={<NationalLandscapeFormPage />} />
                <Route path="/landscape/:id/edit" element={<NationalLandscapeFormPage />} />
                <Route path="/landscape/:year" element={<NationalLandscapePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </HashRouter>
        </TableCacheProvider>
      </DynastiesProvider>
    </SettingsProvider>
  );
}

// HashRouter (not BrowserRouter) because GitHub Pages serves static files with
// no server-side rewrite rules - hash routes never 404 on refresh/deep-link.
function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
