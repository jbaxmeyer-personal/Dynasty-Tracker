import { HashRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { SeasonsPage } from "./pages/Seasons";
import { SeasonFormPage } from "./pages/SeasonForm";
import { SeasonDetailPage } from "./pages/SeasonDetail";
import { GameFormPage } from "./pages/GameForm";
import { ScheduleSetupPage } from "./pages/ScheduleSetup";
import { RecruitsPage } from "./pages/Recruits";
import { RecruitFormPage } from "./pages/RecruitForm";
import { CareerPage } from "./pages/Career";
import { ImportPage } from "./pages/Import";
import { SettingsPage } from "./pages/Settings";
import { NationalLandscapePage } from "./pages/NationalLandscape";
import { NationalLandscapeFormPage } from "./pages/NationalLandscapeForm";

// HashRouter (not BrowserRouter) because GitHub Pages serves static files with
// no server-side rewrite rules - hash routes never 404 on refresh/deep-link.
function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/seasons/new" element={<SeasonFormPage />} />
            <Route path="/seasons/:id" element={<SeasonDetailPage />} />
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
            <Route path="/import" element={<ImportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SettingsProvider>
  );
}

export default App;
