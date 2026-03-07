import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import NewShipment from "./pages/NewShipment";
import CarrierScorecard from "./pages/CarrierScorecard";
import BidComparison from "./pages/BidComparison";
import AwardSimulation from "./pages/AwardSimulation";
import LaneMap from "./pages/LaneMap";
import FeedbackLoop from "./pages/FeedbackLoop";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh", background: "#0D1B2A" }}>
        <Navbar />
        <div style={{
          marginLeft: "280px",
          flex: 1,
          minHeight: "100vh",
          width: "calc(100vw - 280px)",
          overflowX: "hidden",
          transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
        }}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/shipment" element={<NewShipment />} />
            <Route path="/carriers" element={<CarrierScorecard />} />
            <Route path="/bids"     element={<BidComparison />} />
            <Route path="/simulate" element={<AwardSimulation />} />
            <Route path="/lanes"    element={<LaneMap />} />
            <Route path="/feedback" element={<FeedbackLoop />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}