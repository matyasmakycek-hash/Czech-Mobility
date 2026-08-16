import { useEffect, useState } from "react";
import { supabase } from "./supabase";

function App() {
  const [page, setPage] = useState("dashboard");
  const [vehicles, setVehicles] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menu = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "departures", icon: "◈", label: "Výpravy" },
    { id: "vehicles", icon: "▣", label: "Vozy" },
    { id: "reports", icon: "▤", label: "Moje výkazy" },
    { id: "depots", icon: "▦", label: "Provozovny" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const { data: depotData, error: depotError } = await supabase
      .from("provozovny")
      .select("*")
      .order("nazev");

    if (depotError) {
      setError("Nepodařilo se načíst provozovny: " + depotError.message);
      setLoading(false);
      return;
    }

    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vozy")
      .select("*")
      .order("cislo");

    if (vehicleError) {
      setError("Nepodařilo se načíst vozy: " + vehicleError.message);
      setLoading(false);
      return;
    }

    setDepots(depotData || []);
    setVehicles(vehicleData || []);
    setLoading(false);
  }

  function navigate(id) {
    setPage(id);
  }

  const activeVehicles = vehicles.filter(
    (vehicle) => vehicle.stav === "PROVOZNÍ"
  );

  return (
    <div className="app">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Inter, Arial, sans-serif;
          background: #f4f6fa;
          color: #172033;
        }

        button {
          font-family: inherit;
        }

        .app {
          min-height: 100vh;
          display: flex;
        }

        .sidebar {
          width: 255px;
          background: #101827;
          color: white;
          padding: 22px 15px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 30px;
        }

        .brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .brand-title {
          font-size: 16px;
          font-weight: 700;
        }

        .brand-subtitle {
          color: #8d99ad;
          font-size: 12px;
          margin-top: 3px;
        }

        .section-title {
          color: #69758a;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 0 12px;
          margin: 10px 0 8px;
        }

        .menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .menu-button {
          border: 0;
          background: transparent;
          color: #aeb8c9;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          text-align: left;
        }

        .menu-button:hover {
          background: #1a2537;
          color: white;
        }

        .menu-button.active {
          background: #2563eb;
          color: white;
        }

        .user-box {
          margin-top: auto;
          border-top: 1px solid #273245;
          padding: 15px 8px 5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
        }

        .user-role {
          font-size: 11px;
          color: #8d99ad;
          margin-top: 3px;
        }

        .content {
          margin-left: 255px;
          width: calc(100% - 255px);
          padding: 32px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }

        .page-title {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
        }

        .page-description {
          margin: 7px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .profile-button {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 50%;
          background: white;
          color: #2563eb;
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(0,0,0,.06);
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat {
          background: white;
          border-radius: 15px;
          padding: 21px;
          box-shadow: 0 3px 14px rgba(0,0,0,.04);
        }

        .stat-label {
          color: #748096;
          font-size: 13px;
        }

        .stat-value {
          display: block;
          font-size: 29px;
          margin-top: 10px;
          font-weight: 750;
        }

        .panel {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 3px 14px rgba(0,0,0,.04);
          margin-bottom: 20px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .panel-title {
          margin: 0;
          font-size: 18px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .depot-card {
          border: 1px solid #e3e8f0;
          border-radius: 13px;
          padding: 18px;
          background: white;
        }

        .depot-code {
          display: inline-flex;
          background: #eaf1ff;
          color: #2563eb;
          padding: 5px 8px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .depot-name {
          font-size: 16px;
          font-weight: 700;
          margin-top: 13px;
        }

        .depot-info {
          color: #7b879a;
          font-size: 12px;
          margin-top: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          color: #7a8699;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #e7ebf1;
        }

        td {
          padding: 14px 12px;
          border-bottom: 1px solid #eef1f5;
          font-size: 13px;
        }

        .badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-green {
          background: #e7f7ee;
          color: #16834d;
        }

        .badge-gray {
          background: #edf0f4;
          color: #6b7280;
        }

        .badge-red {
          background: #fdecec;
          color: #c53030;
        }

        .empty {
          text-align: center;
          color: #7b879a;
          padding: 35px;
        }

        .error {
          background: #fff0f0;
          color: #c53030;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 50px;
          color: #718096;
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 210px;
          }

          .content {
            margin-left: 210px;
            width: calc(100% - 210px);
          }

          .stats,
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 650px) {
          .sidebar {
            display: none;
          }

          .content {
            margin-left: 0;
            width: 100%;
            padding: 20px;
          }

          .stats,
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CM</div>
          <div>
            <div className="brand-title">Czech Mobility</div>
            <div className="brand-subtitle">VDP systém</div>
          </div>
        </div>

        <div className="section-title">Navigace</div>

        <nav className="menu">
          {menu.map((item) => (
            <button
              key={item.id}
              className={`menu-button ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-box">
          <div className="avatar">M</div>
          <div>
            <div className="user-name">Uživatel</div>
            <div className="user-role">Řidič</div>
          </div>
        </div>
      </aside>

      <main className="content">
        <div className="topbar">
          <div>
            <h1 className="page-title">
              {menu.find((item) => item.id === page)?.label}
            </h1>

            <p className="page-description">
              Informační systém Czech Mobility
            </p>
          </div>

          <button className="profile-button">M</button>
        </div>

        {loading && (
          <div className="panel">
            <div className="loading">
              Načítám data...
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <>
            {page === "dashboard" && (
              <Dashboard
                vehicles={vehicles}
                activeVehicles={activeVehicles}
                depots={depots}
              />
            )}

            {page === "vehicles" && (
              <Vehicles
                vehicles={vehicles}
                depots={depots}
              />
            )}

            {page === "depots" && (
              <Depots
                vehicles={vehicles}
                depots={depots}
              />
            )}

            {page === "departures" && <Departures />}

            {page === "reports" && <Reports />}
          </>
        )}
      </main>
    </div>
  );
}

function Dashboard({ vehicles, activeVehicles, depots }) {
  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Dnešní výpravy</span>
          <strong className="stat-value">0</strong>
        </div>

        <div className="stat">
          <span className="stat-label">Aktivní vozy</span>
          <strong className="stat-value">
            {activeVehicles.length}
          </strong>
        </div>

        <div className="stat">
          <span className="stat-label">Vozy celkem</span>
          <strong className="stat-value">
            {vehicles.length}
          </strong>
        </div>

        <div className="stat">
          <span className="stat-label">Provozovny</span>
          <strong className="stat-value">
            {depots.length}
          </strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            Czech Mobility
          </h2>
        </div>

        <p>
          Vítejte v systému pro správu vozů, výprav a výkazů.
        </p>

        <p className="page-description">
          Data o vozech jsou načítána přímo z databáze.
        </p>
      </div>
    </>
  );
}

function Vehicles({ vehicles, depots }) {
  if (vehicles.length === 0) {
    return (
      <div className="panel">
        <div className="empty">
          V databázi nejsou žádné vozy.
        </div>
      </div>
    );
  }

  return (
    <>
      {depots.map((depot) => {
        const depotVehicles = vehicles.filter(
          (vehicle) =>
            vehicle.provozovna_id === depot.id
        );

        return (
          <div className="panel" key={depot.id}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">
                  {depot.nazev}
                </h2>

                <p className="page-description">
                  Provozovna {depot.kod} ·{" "}
                  {depotVehicles.length} vozů
                </p>
              </div>
            </div>

            {depotVehicles.length === 0 ? (
              <div className="empty">
                Žádné vozy v této provozovně.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vůz</th>
                    <th>Výrobce</th>
                    <th>Typ</th>
                    <th>SPZ</th>
                    <th>Rok</th>
                    <th>Stav</th>
                  </tr>
                </thead>

                <tbody>
                  {depotVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <strong>{vehicle.cislo}</strong>
                      </td>

                      <td>
                        {vehicle.vyrobce || "-"}
                      </td>

                      <td>
                        {vehicle.typ || "-"}
                      </td>

                      <td>
                        {vehicle.spz || "-"}
                      </td>

                      <td>
                        {vehicle.rok || "-"}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            vehicle.stav === "PROVOZNÍ"
                              ? "badge-green"
                              : vehicle.stav ===
                                "PRODÁN / PŘEDÁN JINEMU DOPRAVCI"
                              ? "badge-red"
                              : "badge-gray"
                          }`}
                        >
                          {vehicle.stav || "Neuvedeno"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </>
  );
}

function Depots({ vehicles, depots }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          Provozovny
        </h2>
      </div>

      {depots.length === 0 ? (
        <div className="empty">
          Žádné provozovny.
        </div>
      ) : (
        <div className="grid">
          {depots.map((depot) => {
            const count = vehicles.filter(
              (vehicle) =>
                vehicle.provozovna_id === depot.id
            ).length;

            return (
              <div
                className="depot-card"
                key={depot.id}
              >
                <span className="depot-code">
                  {depot.kod}
                </span>

                <div className="depot-name">
                  {depot.nazev}
                </div>

                <div className="depot-info">
                  {count} vozů
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Departures() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          Výpravy
        </h2>
      </div>

      <div className="empty">
        Výpravy zatím nejsou vytvořené.
        <br />
        Tuto část napojíme na databázi jako další krok.
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          Moje výkazy
        </h2>
      </div>

      <div className="empty">
        Přihlášení a osobní výkazy přidáme v dalším kroku.
      </div>
    </div>
  );
}

export default App;
