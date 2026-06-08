import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { MembersProvider } from "./context/MembersContext";
import { EventsProvider } from "./context/EventsContext";
import { ConnectProvider } from "./context/ConnectContext";
import { CheckinProvider } from "./context/CheckinContext";
import { PipelineProvider } from "./context/PipelineContext";
import { TagsProvider } from "./context/TagsContext";
import { NewsProvider } from "./context/NewsContext";
import { AppRoutes } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <MembersProvider>
        <AuthProvider>
          <ThemeProvider>
            <NewsProvider>
              <EventsProvider>
                <ConnectProvider>
                  <CheckinProvider>
                    <PipelineProvider>
                      <TagsProvider>
                        <AppRoutes />
                        <Toaster />
                      </TagsProvider>
                    </PipelineProvider>
                  </CheckinProvider>
                </ConnectProvider>
              </EventsProvider>
            </NewsProvider>
          </ThemeProvider>
        </AuthProvider>
      </MembersProvider>
    </BrowserRouter>
  );
}
