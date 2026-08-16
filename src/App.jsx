import { useState } from "react";

function App() {
  const [page, setPage] = useState("dashboard");

  const menu = [
    ["dashboard", "🏠", "Dashboard"],
    ["dispatch", "🚍", "Výpravy"],
    ["vehicles", "🚌", "Vozy"],
    ["reports", "📋", "Moje výkazy"],
    ["depots", "🏢", "Provozovny"],
  ];

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>CM</div>
          <div>
            <strong>Czech Mobility</strong>
            <small>VDP systém</small>
          </div>
        </div>

        <nav>
          {menu.map(([id, icon, name]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              style={{
                ...styles.menuButton,
                ...(page === id ? styles.menuActive : {}),
              }}
            >
              <span>{icon}</span>
              {name}
            </button>
          ))}
        </nav>

        <div style={styles.user}>
          <div style={styles.avatar}>M</div>
          <div>
            <strong>Uživatel</strong>
            <small>Řidič</small>
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1>{menu.find((item) => item[0] === page)?.[2]}</h1>
            <p>Czech Mobility</p>
          </div>

          <button style={styles.profile}>M</button>
        </header>

        {page === "dashboard" && (
          <section>
            <div style={styles.cards}>
              <Card title="Dnešní výpravy" value="0" />
              <Card title="Aktivní vozy" value="0" />
              <Card title="Moje výkazy" value="0" />
            </div>

            <div style={styles.panel}>
              <h2>Vítejte v Czech Mobility 👋</h2>
              <p>
                Po přihlášení zde uvidíte své služby, výpravy a výkazy.
              </p>
            </div>
          </section>
        )}

        {page === "dispatch" && (
          <Panel title="Výpravy">
            <p>Zde bude tabulka výprav.</p>
          </Panel>
        )}

        {page === "vehicles" && (
          <Panel title="Vozy">
            <p>Zde bude seznam vozů podle provozoven.</p>
          </Panel>
        )}

        {page === "reports" && (
          <Panel title="Moje výkazy">
            <p>Zde budou pouze tvoje vlastní výkazy.</p>
          </Panel>
        )}

        {page === "depots" && (
          <Panel title="Provozovny">
            <p>Zde budou jednotlivé provozovny.</p>
          </Panel>
        )}
      </main>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={styles.card}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={styles.panel}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "250px",
    background: "#111827",
    color: "white",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "35px",
    padding: "0 8px",
  },
  logoIcon: {
    background: "#2563eb",
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "grid",
    placeItems: "center",
    fontWeight: "bold",
  },
  menuButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: "13px 12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
    marginBottom: "5px",
    fontSize: "15px",
  },
  menuActive: {
    background: "#2563eb",
    color: "white",
  },
  user: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    borderTop: "1px solid #374151",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#2563eb",
    display: "grid",
    placeItems: "center",
    fontWeight: "bold",
  },
  main: {
    flex: 1,
    padding: "35px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  header h1: {
    margin: 0,
  },
  profile: {
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,.05)",
  },
  panel: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    marginTop: "22px",
    boxShadow: "0 2px 10px rgba(0,0,0,.05)",
  },
};

export default App;
