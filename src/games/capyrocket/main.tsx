import { createRoot } from "react-dom/client";
import CapiRocketApp from "./CapiRocketApp";
import "./capyrocket.css";

// Entrada Vite standalone do protótipo CapiRocket Dash.
// Não registra service worker nem importa nada do Beast Arena — roda 100% isolado.
createRoot(document.getElementById("capy-root")!).render(<CapiRocketApp />);
