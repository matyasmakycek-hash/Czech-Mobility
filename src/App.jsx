import { useState } from "react";
import { supabase } from "./supabase";

const depots = [
  {
    id: 1,
    name: "Hradec Králové",
    code: "HK",
    vehicles: [
      { id: 101, type: "Solaris Urbino 12", status: "Vypraven" },
      { id: 102, type: "Škoda 12", status: "Volný" },
      { id: 103, type: "SOR", status: "Volný" },
    ],
  },
  {
    id: 2,
    name: "Pardubice",
    code: "PCE",
    vehicles: [
      { id: 201, type: "Solaris Urbino 12", status: "Vypraven" },
      { id: 202, type: "Crossway", status: "Volný" },
    ],
  },
];

const departures = [
  {
    vehicle: "101",
    course: "101/1",
    driver: "Maty",
    depot: "Hradec Králové",
    status: "Vypraven",
  },
  {
    vehicle: "103",
    course: "103/1",
    driver: "Petr",
    depot: "Hradec Králové",
    status: "Vypraven",
  },
  {
    vehicle: "201",
    course: "201/1",
    driver: "Jan",
    depot: "Pardubice",
    status: "Vypraven",
  },
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedDepot, setSelectedDepot] = useState(null);

  const menu = [
    { id: "dashboard", icon: "⌂", label: "Dashboard" },
    { id: "departures", icon: "◈", label: "Výpravy" },
    { id: "vehicles", icon: "▣", label: "Vozy" },
    { id: "reports", icon: "▤", label: "Moje výkazy" },
    { id: "depots", icon: "▦", label: "Provozovny" },
  ];

  function navigate(id) {
    setPage(id);
    setSelectedDepot(null);
  }

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
          cursor: pointer;
          transition: .15s;
          background: white;
        }

        .depot-card:hover {
          border-color: #2563eb;
          transform: translateY(-1px);
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

        .back-button {
          border: 0;
          background: #eef2f7;
          color: #374151;
          padding: 9px 13px;
          border-radius: 9px;
          cursor: pointer;
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

        .empty {
          text-align: center;
          color: #7b879a;
          padding: 35px;
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
              className={`menu-button ${page === item.id ? "active" : ""}`}
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

        {page === "dashboard" && <Dashboard />}

        {page === "departures" && (
          <Departures
            selectedDepot={selectedDepot}
            setSelectedDepot={setSelectedDepot}
          />
        )}

        {page === "vehicles" && <Vehicles />}

        {page === "reports" && <Reports />}

        {page === "depots" && <Depots />}
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Dnešní výpravy</span>
          <strong className="stat-value">3</strong>
        </div>

        <div className="stat">
          <span className="stat-label">Aktivní vozy</span>
          <strong className="stat-value">3</strong>
        </div>

        <div className="stat">
          <span className="stat-label">Provozovny</span>
          <strong className="stat-value">{depots.length}</strong>
        </div>

        <div className="stat">
          <span className="stat-label">Moje výkazy</span>
          <strong className="stat-value">0</strong>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Czech Mobility</h2>
        </div>

        <p>
          Vítejte v systému pro správu vozů, výprav a výkazů.
        </p>
      </div>
    </>
  );
}

function Departures({ selectedDepot, setSelectedDepot }) {
  if (!selectedDepot) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Vyberte provozovnu</h2>
        </div>

        <div className="grid">
          {depots.map((depot) => (
            <div
              className="depot-card"
              key={depot.id}
              onClick={() => setSelectedDepot(depot.name)}
            >
              <span className="depot-code">{depot.code}</span>
              <div className="depot-name">{depot.name}</div>
              <div className="depot-info">
                {depot.vehicles.length} vozů
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const depotDepartures = departures.filter(
    (item) => item.depot === selectedDepot
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{selectedDepot}</h2>
          <p className="page-description">
            Výpravy této provozovny
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => setSelectedDepot(null)}
        >
          ← Provozovny
        </button>
      </div>

      {depotDepartures.length === 0 ? (
        <div className="empty">Žádné výpravy.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Vůz</th>
              <th>Kurz</th>
              <th>Řidič</th>
              <th>Stav</th>
            </tr>
          </thead>

          <tbody>
            {depotDepartures.map((item, index) => (
              <tr key={index}>
                <td><strong>{item.vehicle}</strong></td>
                <td>{item.course}</td>
                <td>{item.driver}</td>
                <td>
                  <span className="badge badge-green">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Vehicles() {
  return (
    <>
      {depots.map((depot) => (
        <div className="panel" key={depot.id}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">{depot.name}</h2>
              <p className="page-description">
                Provozovna {depot.code}
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Vůz</th>
                <th>Typ</th>
                <th>Stav</th>
              </tr>
            </thead>

            <tbody>
              {depot.vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td><strong>{vehicle.id}</strong></td>
                  <td>{vehicle.type}</td>
                  <td>
                    <span
                      className={`badge ${
                        vehicle.status === "Vypraven"
                          ? "badge-green"
                          : "badge-gray"
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}

function Reports() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Moje výkazy</h2>
      </div>

      <div className="empty">
        Zatím nemáte žádné výkazy.
      </div>
    </div>
  );
}

function Depots() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">Provozovny</h2>
      </div>

      <div className="grid">
        {depots.map((depot) => (
          <div className="depot-card" key={depot.id}>
            <span className="depot-code">{depot.code}</span>
            <div className="depot-name">{depot.name}</div>
            <div className="depot-info">
              {depot.vehicles.length} vozů
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
