```jsx
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

          {error && <div className="login-error">{error}</div>}

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

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("vozy")
      .select("*")
      .order("cislo", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      setVehicles([]);
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) =>
    `
      ${vehicle.cislo || ""}
      ${vehicle.vyrobce || ""}
      ${vehicle.typ || ""}
      ${vehicle.spz || ""}
      ${vehicle.rok || ""}
      ${vehicle.stav || ""}
    `
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
                <strong>{vehicle.cislo || "-"}</strong>
                <span>{vehicle.vyrobce || "-"}</span>
                <span>{vehicle.typ || "-"}</span>
                <span>{vehicle.spz || "-"}</span>
                <span>{vehicle.rok || "-"}</span>

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
   ADMINISTRACE VOZŮ
========================= */

function AdminVehicles() {
  const emptyForm = {
    cislo: "",
    vyrobce: "",
    typ: "",
    spz: "",
    rok: "",
    barevne_schema: "",
    stav: "Aktivní",
    provozovna_id: "",
  };

  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("vozy")
      .select("*")
      .order("cislo", { ascending: true });

    if (error) {
      setError(error.message);
      setVehicles([]);
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function startEdit(vehicle) {
    setEditingId(vehicle.id);

    setForm({
      cislo: vehicle.cislo ?? "",
      vyrobce: vehicle.vyrobce ?? "",
      typ: vehicle.typ ?? "",
      spz: vehicle.spz ?? "",
      rok: vehicle.rok ?? "",
      barevne_schema: vehicle.barevne_schema ?? "",
      stav: vehicle.stav ?? "Aktivní",
      provozovna_id: vehicle.provozovna_id ?? "",
    });

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function saveVehicle(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const vehicleData = {
      cislo: form.cislo || null,
      vyrobce: form.vyrobce || null,
      typ: form.typ || null,
      spz: form.spz || null,
      rok: form.rok ? Number(form.rok) : null,
      barevne_schema: form.barevne_schema || null,
      stav: form.stav || null,
      provozovna_id: form.provozovna_id || null,
    };

    let result;

    if (editingId) {
      result = await supabase
        .from("vozy")
        .update(vehicleData)
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("vozy")
        .insert([vehicleData]);
    }

    if (result.error) {
      console.error(result.error);
      setError(result.error.message);
    } else {
      setSuccess(
        editingId
          ? "Vůz byl úspěšně upraven."
          : "Vůz byl úspěšně přidán."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadVehicles();
    }

    setSaving(false);
  }

  async function deleteVehicle(id, cislo) {
    const confirmed = window.confirm(
      `Opravdu chceš smazat vůz ${cislo || ""}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("vozy")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setSuccess("Vůz byl smazán.");

    await loadVehicles();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Administrace vozů</h1>
          <p>
            Přidávání, úprava a mazání vozů
          </p>
        </div>

        <div className="profile-badge">
          ADMIN
        </div>
      </div>

      <div className="panel admin-form-panel">
        <h2>
          {editingId
            ? "✏️ Upravit vůz"
            : "➕ Přidat nový vůz"}
        </h2>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        <form
          className="vehicle-form"
          onSubmit={saveVehicle}
        >
          <div className="form-grid">

            <div>
              <label>Číslo vozu</label>
              <input
                name="cislo"
                value={form.cislo}
                onChange={handleChange}
                placeholder="Např. 101"
                required
              />
            </div>

            <div>
              <label>Výrobce</label>
              <input
                name="vyrobce"
                value={form.vyrobce}
                onChange={handleChange}
                placeholder="Např. Škoda"
                required
              />
            </div>

            <div>
              <label>Typ</label>
              <input
                name="typ"
                value={form.typ}
                onChange={handleChange}
                placeholder="Např. 12T"
                required
              />
            </div>

            <div>
              <label>SPZ</label>
              <input
                name="spz"
                value={form.spz}
                onChange={handleChange}
                placeholder="1AA 1234"
              />
            </div>

            <div>
              <label>Rok výroby</label>
              <input
                name="rok"
                type="number"
                value={form.rok}
                onChange={handleChange}
                placeholder="2026"
              />
            </div>

            <div>
              <label>Barevné schéma</label>
              <input
                name="barevne_schema"
                value={form.barevne_schema}
                onChange={handleChange}
                placeholder="Např. modro-bílé"
              />
            </div>

            <div>
              <label>Stav</label>

              <select
                name="stav"
                value={form.stav}
                onChange={handleChange}
              >
                <option value="Aktivní">
                  Aktivní
                </option>

                <option value="Mimo provoz">
                  Mimo provoz
                </option>

                <option value="Údržba">
                  Údržba
                </option>

                <option value="Vyřazený">
                  Vyřazený
                </option>
              </select>
            </div>

            <div>
              <label>Provozovna ID</label>
              <input
                name="provozovna_id"
                value={form.provozovna_id}
                onChange={handleChange}
                placeholder="ID provozovny"
              />
            </div>

          </div>

          <div className="form-buttons">
            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Ukládání..."
                : editingId
                ? "💾 Uložit změny"
                : "➕ Přidat vůz"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
              >
                Zrušit úpravu
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel admin-list-panel">
        <div className="admin-list-title">
          <div>
            <h2>Vozový park</h2>
            <p>
              Celkem {vehicles.length} vozů
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty">
            Načítání...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty">
            Zatím zde nejsou žádné vozy.
          </div>
        ) : (
          <div className="admin-vehicle-list">
            {vehicles.map((vehicle) => (
              <div
                className="admin-vehicle-row"
                key={vehicle.id}
              >
                <div className="vehicle-main">
                  <strong>
                    {vehicle.cislo || "-"}
                  </strong>

                  <div>
                    <b>
                      {vehicle.vyrobce || "-"}
                    </b>

                    <span>
                      {vehicle.typ || "-"}
                    </span>
                  </div>
                </div>

                <div>
                  <small>SPZ</small>
                  <strong>
                    {vehicle.spz || "-"}
                  </strong>
                </div>

                <div>
                  <small>Rok</small>
                  <strong>
                    {vehicle.rok || "-"}
                  </strong>
                </div>

                <div>
                  <small>Stav</small>

                  <span className="status">
                    {vehicle.stav || "-"}
                  </span>
                </div>

                <div className="admin-actions">
                  <button
                    className="edit-button"
                    onClick={() =>
                      startEdit(vehicle)
                    }
                  >
                    ✏️ Upravit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteVehicle(
                        vehicle.id,
                        vehicle.cislo
                      )
                    }
                  >
                    🗑️ Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
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

        <main className="content">

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
                  <strong>0</strong>
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
                  <strong>1</strong>
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

          {page === "vehicles" && (
            <Vehicles />
          )}

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

          {page === "admin" &&
            isAdmin && (
              <AdminVehicles />
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
input,
select {
  font-family: inherit;
}

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

.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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

.panel {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
}

.vehicles-panel {
  margin-top: 25px;
}

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

.vehicle-header,
.vehicle-row {
  display: grid;
  grid-template-columns: 80px 140px 1fr 120px 80px 120px;
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
  margin-bottom: 20px;
}

.success-box {
  padding: 15px;
  border-radius: 9px;
  background: #dcfce7;
  color: #15803d;
  margin-bottom: 20px;
}

.admin-form-panel {
  margin-top: 25px;
}

.admin-form-panel h2 {
  margin-top: 0;
  margin-bottom: 25px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.form-grid label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 7px;
}

.form-grid input,
.form-grid select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  outline: none;
  background: white;
}

.form-grid input:focus,
.form-grid select:focus {
  border-color: #2563eb;
}

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.primary-button,
.secondary-button,
.edit-button,
.delete-button {
  border: 0;
  border-radius: 9px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

.primary-button {
  background: #2563eb;
  color: white;
}

.secondary-button {
  background: #e5e7eb;
  color: #374151;
}

.admin-list-panel {
  margin-top: 25px;
}

.admin-list-title {
  margin-bottom: 15px;
}

.admin-list-title h2 {
  margin: 0;
}

.admin-list-title p {
  margin-top: 5px;
  color: #718096;
}

.admin-vehicle-list {
  border-top: 1px solid #edf0f5;
}

.admin-vehicle-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 16px 5px;
  border-bottom: 1px solid #edf0f5;
}

.admin-vehicle-row small {
  display: block;
  color: #718096;
  font-size: 11px;
  margin-bottom: 4px;
}

.vehicle-main {
  display: flex;
  gap: 15px;
  align-items: center;
}

.vehicle-main > strong {
  min-width: 55px;
  font-size: 18px;
}

.vehicle-main div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.vehicle-main span {
  color: #718096;
  font-size: 12px;
}

.admin-actions {
  display: flex;
  gap: 7px;
}

.edit-button {
  background: #dbeafe;
  color: #1d4ed8;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 1000px) {
  .admin-vehicle-row {
    grid-template-columns: 1fr 1fr;
  }

  .admin-actions {
    grid-column: 1 / -1;
  }
}

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
    grid-template-columns: 70px 1fr 1fr;
  }

  .vehicle-header span:nth-child(n+4),
  .vehicle-row span:nth-child(n+4) {
    display: none;
  }

  .form-grid {
    grid-template-columns: 1fr;
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

  .admin-vehicle-row {
    grid-template-columns: 1fr;
  }
}
`;

export default App;
```
