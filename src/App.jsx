import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAIL = "matyas.makycek@gmail.com";

/* =========================
   LOGIN
========================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Nesprávný e-mail nebo heslo.");
      setLoading(false);
      return;
    }

    onLogin(data.user);
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">CM</div>

        <h1>Czech Mobility</h1>
        <p>VDP systém</p>

        <form onSubmit={handleLogin}>
          <label>E-mail</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vas@email.cz"
            required
          />

          <label>Heslo</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Přihlašování..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================
   VOZY
========================= */

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("vozy")
      .select(`
        id,
        cislo,
        vyrobce,
        typ,
        spz,
        rok,
        barevne_schema,
        stav,
        provozovna_id,
        vytvoreno
      `)
      .order("cislo", { ascending: true });

    console.log("VOZY DATA:", data);
    console.log("VOZY ERROR:", error);

    if (error) {
      console.error("Chyba při načítání vozů:", error);
      setError(error.message);
      setVehicles([]);
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const text = `
      ${vehicle.cislo || ""}
      ${vehicle.vyrobce || ""}
      ${vehicle.typ || ""}
      ${vehicle.spz || ""}
      ${vehicle.rok || ""}
      ${vehicle.barevne_schema || ""}
      ${vehicle.stav || ""}
    `
      .toLowerCase()
      .trim();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Vozy</h1>
          <p>Vozový park Czech Mobility</p>
        </div>

        <div className="profile-badge">
          {vehicles.length} VOZŮ
        </div>
      </div>

      <div className="panel vehicles-panel">

        <input
          className="search"
          type="text"
          placeholder="🔎 Hledat vůz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && (
          <div className="empty">
            Načítání vozů...
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>Chyba při načítání vozů:</strong>
            <br />
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="vehicle-header">
              <span>Číslo</span>
              <span>Výrobce</span>
              <span>Typ</span>
              <span>SPZ</span>
              <span>Rok</span>
              <span>Stav</span>
            </div>

            {filteredVehicles.map((vehicle) => (
              <div
                className="vehicle-row"
                key={vehicle.id}
              >
                <strong>
                  {vehicle.cislo || "-"}
                </strong>

                <span>
                  {vehicle.vyrobce || "-"}
                </span>

                <span>
                  {vehicle.typ || "-"}
                </span>

                <span>
                  {vehicle.spz || "-"}
                </span>

                <span>
                  {vehicle.rok || "-"}
                </span>

                <span>
                  <span className="status">
                    {vehicle.stav || "-"}
                  </span>
                </span>
              </div>
            ))}

            {filteredVehicles.length === 0 && (
              <div className="empty">
                {vehicles.length === 0
                  ? "Tabulka vozy neobsahuje žádné záznamy."
                  : "Žádné vozy neodpovídají hledání."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
   APP
========================= */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);

        if (!session?.user) {
          setPage("dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user ?? null);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setPage("dashboard");
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>

        <div className="loading">
          Načítání...
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>

        <Login
          onLogin={(loggedUser) =>
            setUser(loggedUser)
          }
        />
      </>
    );
  }

  const isAdmin =
    user.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

  return (
    <>
      <style>{styles}</style>

      <div className="app">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="brand">
            <div className="brand-logo">
              CM
            </div>

            <div>
              <div className="brand-title">
                Czech Mobility
              </div>

              <div className="brand-subtitle">
                VDP systém
              </div>
            </div>
          </div>

          <div className="section-title">
            Navigace
          </div>

          <nav className="menu">

            <button
              className={
                page === "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("dashboard")
              }
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              className={
                page === "departures"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("departures")
              }
            >
              <span>◈</span>
              Výpravy
            </button>

            <button
              className={
                page === "vehicles"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("vehicles")
              }
            >
              <span>▣</span>
              Vozy
            </button>

            <button
              className={
                page === "reports"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("reports")
              }
            >
              <span>▤</span>
              Moje výkazy
            </button>

            {isAdmin && (
              <button
                className={
                  page === "admin"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("admin")
                }
              >
                <span>⚙</span>
                Administrace
              </button>
            )}

          </nav>

          {/* USER */}

          <div className="user-box">

            <div className="avatar">
              {(user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">

              <div className="user-name">
                {isAdmin
                  ? "Maty"
                  : user.email}
              </div>

              <div className="user-role">
                {isAdmin
                  ? "Administrátor"
                  : "Řidič"}
              </div>

            </div>

            <button
              className="logout"
              onClick={logout}
            >
              Odhlásit
            </button>

          </div>

        </aside>

        {/* CONTENT */}

        <main className="content">

          {/* DASHBOARD */}

          {page === "dashboard" && (
            <>
              <div className="topbar">

                <div>
                  <h1>
                    Dashboard
                  </h1>

                  <p>
                    Informační systém
                    Czech Mobility
                  </p>
                </div>

                <div className="profile-badge">
                  {isAdmin
                    ? "ADMIN"
                    : "ŘIDIČ"}
                </div>

              </div>

              <div className="stats">

                <div className="stat">
                  <span>
                    Dnešní výpravy
                  </span>

                  <strong>
                    0
                  </strong>
                </div>

                <div className="stat">
                  <span>
                    Aktivní vozy
                  </span>

                  <strong>
                    14
                  </strong>
                </div>

                <div className="stat">
                  <span>
                    Vozy celkem
                  </span>

                  <strong>
                    42
                  </strong>
                </div>

                <div className="stat">
                  <span>
                    Provozovny
                  </span>

                  <strong>
                    1
                  </strong>
                </div>

              </div>

              <div className="panel">

                <h2>
                  Vítej,{" "}
                  {isAdmin
                    ? "Maty"
                    : user.email}{" "}
                  👋
                </h2>

                <p>
                  Jsi přihlášen jako{" "}
                  <strong>
                    {isAdmin
                      ? "administrátor"
                      : "řidič"}
                  </strong>.
                </p>

              </div>
            </>
          )}

          {/* VÝPRAVY */}

          {page === "departures" && (
            <div className="panel">

              <h1>
                Výpravy
              </h1>

              <p>
                Tady budou výpravy vozů.
              </p>

            </div>
          )}

          {/* VOZY */}

          {page === "vehicles" && (
            <Vehicles />
          )}

          {/* VÝKAZY */}

          {page === "reports" && (
            <div className="panel">

              <h1>
                Moje výkazy
              </h1>

              <p>
                Zde budou výkazy
                přihlášeného řidiče.
              </p>

            </div>
          )}

          {/* ADMIN */}

          {page === "admin" &&
            isAdmin && (
              <div className="panel">

                <h1>
                  Administrace
                </h1>

                <p>
                  Správa systému
                  Czech Mobility.
                </p>

              </div>
            )}

        </main>
      </div>
    </>
  );
}

/* =========================
   STYLY
========================= */

const styles = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f6fa;
  color: #172033;
}

button,
input {
  font-family: inherit;
}

/* LOGIN */

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 390px;
  background: white;
  padding: 35px;
  border-radius: 18px;
  box-shadow: 0 8px 35px rgba(0,0,0,.08);
}

.login-logo {
  width: 55px;
  height: 55px;
  border-radius: 14px;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  margin-bottom: 20px;
}

.login-box h1 {
  margin: 0;
}

.login-box p {
  color: #718096;
}

.login-box label {
  display: block;
  margin: 15px 0 7px;
  font-size: 13px;
  font-weight: 600;
}

.login-box input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
}

.login-box form button {
  width: 100%;
  border: 0;
  background: #2563eb;
  color: white;
  padding: 13px;
  border-radius: 9px;
  margin-top: 22px;
  cursor: pointer;
  font-weight: 700;
}

.login-error {
  color: #dc2626;
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  margin-top: 15px;
}

/* LOADING */

.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* APP */

.app {
  min-height: 100vh;
  display: flex;
}

/* SIDEBAR */

.sidebar {
  width: 255px;
  background: #101827;
  color: white;
  padding: 22px 15px;
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
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
  font-weight: 700;
}

.brand-subtitle {
  color: #8d99ad;
  font-size: 12px;
}

.section-title {
  color: #69758a;
  font-size: 11px;
  text-transform: uppercase;
  padding: 0 12px;
  margin-bottom: 8px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu button {
  border: 0;
  background: transparent;
  color: #aeb8c9;
  padding: 12px;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  display: flex;
  gap: 10px;
  align-items: center;
}

.menu button:hover,
.menu button.active {
  background: #2563eb;
  color: white;
}

/* USER */

.user-box {
  margin-top: auto;
  border-top: 1px solid #273245;
  padding: 15px 5px;
  display: flex;
  align-items: center;
  gap: 9px;
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

.user-info {
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: #8d99ad;
}

.logout {
  border: 0;
  background: #273245;
  color: white;
  padding: 7px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 10px;
}

/* CONTENT */

.content {
  margin-left: 255px;
  padding: 35px;
  width: calc(100% - 255px);
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.topbar h1 {
  margin: 0;
}

.topbar p {
  color: #718096;
}

.profile-badge {
  background: #2563eb;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

/* STATS */

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 25px 0;
}

.stat {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
}

.stat span {
  color: #718096;
  font-size: 13px;
}

.stat strong {
  display: block;
  font-size: 30px;
  margin-top: 10px;
}

/* PANEL */

.panel {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
}

.vehicles-panel {
  margin-top: 25px;
}

/* SEARCH */

.search {
  width: 100%;
  padding: 13px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  outline: none;
  margin-bottom: 20px;
}

.search:focus {
  border-color: #2563eb;
}

/* VEHICLES */

.vehicle-header,
.vehicle-row {
  display: grid;
  grid-template-columns:
    80px
    140px
    1fr
    120px
    80px
    120px;
  gap: 15px;
  align-items: center;
}

.vehicle-header {
  background: #f8fafc;
  padding: 13px;
  border-radius: 9px;
  color: #718096;
  font-size: 12px;
  font-weight: 700;
}

.vehicle-row {
  padding: 16px 13px;
  border-bottom: 1px solid #edf0f5;
  font-size: 14px;
}

.status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  background: #dcfce7;
  color: #15803d;
  font-size: 11px;
  font-weight: 700;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.error-box {
  padding: 15px;
  border-radius: 9px;
  background: #fee2e2;
  color: #b91c1c;
}

/* RESPONSIVE */

@media (max-width: 800px) {

  .sidebar {
    width: 210px;
  }

  .content {
    margin-left: 210px;
    width: calc(100% - 210px);
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .vehicle-header,
  .vehicle-row {
    grid-template-columns:
      70px
      1fr
      1fr;
  }

  .vehicle-header span:nth-child(n+4),
  .vehicle-row span:nth-child(n+4) {
    display: none;
  }
}

@media (max-width: 600px) {

  .sidebar {
    display: none;
  }

  .content {
    margin-left: 0;
    width: 100%;
    padding: 20px;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
`;

export default App;
