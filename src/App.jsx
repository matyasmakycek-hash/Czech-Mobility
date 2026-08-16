import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAIL = "matyas.makycek@gmail.com";

/* =========================================================
   STAVY VOZIDEL
========================================================= */

const VEHICLE_STATUSES = [
  "PROVOZNÍ",
  "V DÍLNĚ / V OPRAVĚ",
  "DOČASNĚ ODSTAVEN",
  "DLOUHODOBĚ/ DEFINITIVNĚ ODSTAVEN",
  "SEŠROTOVÁN",
  "PRODÁN / PŘEDÁN JINÉMU DOPRAVCI",
  "DOSUD NEZAŘAZEN DO PROVOZU",
  "SLUŽEBNÍ",
  "RETRO",
];

const STATUS_COLORS = {
  "PROVOZNÍ": "#CAFFCA",
  "V DÍLNĚ / V OPRAVĚ": "#FFCA97",
  "DOČASNĚ ODSTAVEN": "#EAEAEA",
  "DLOUHODOBĚ/ DEFINITIVNĚ ODSTAVEN": "#CACACA",
  "SEŠROTOVÁN": "#FFCACA",
  "PRODÁN / PŘEDÁN JINÉMU DOPRAVCI": "#FFCAFF",
  "DOSUD NEZAŘAZEN DO PROVOZU": "#CACAFF",
  "SLUŽEBNÍ": "#FFFFCA",
  "RETRO": "#CAFFFF",
};

function getStatusStyle(status) {
  return {
    backgroundColor:
      STATUS_COLORS[status] || "#EAEAEA",
    color: "#172033",
  };
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error("LOGIN ERROR:", error);
      setError("Nesprávný e-mail nebo heslo.");
      setLoading(false);
      return;
    }

    if (data?.user) {
      onLogin(data.user);
    }

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
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="vas@email.cz"
            required
          />

          <label>Heslo</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="••••••••"
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Přihlašování..."
              : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   VOZY
========================================================= */

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
      .select(
        "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id, vytvoreno"
      )
      .order("cislo", {
        ascending: true,
      });

    console.log("VOZY DATA:", data);
    console.log("VOZY ERROR:", error);

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

  const filteredVehicles =
    vehicles.filter((vehicle) => {
      const searchText = [
        vehicle.cislo,
        vehicle.vyrobce,
        vehicle.typ,
        vehicle.spz,
        vehicle.rok,
        vehicle.barevne_schema,
        vehicle.stav,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      return searchText.includes(
        search.toLowerCase()
      );
    });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Vozy</h1>
          <p>
            Vozový park Czech Mobility
          </p>
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
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {loading && (
          <div className="empty">
            Načítání vozů...
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>
              Chyba při načítání vozů:
            </strong>

            <br />

            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredVehicles.length > 0 && (
              <div className="vehicle-header">
                <span>Číslo</span>
                <span>Výrobce</span>
                <span>Typ</span>
                <span>SPZ</span>
                <span>Rok</span>
                <span>Stav</span>
              </div>
            )}

            {filteredVehicles.map(
              (vehicle) => (
                <div
                  className="vehicle-row"
                  key={vehicle.id}
                >
                  <strong>
                    {vehicle.cislo ?? "-"}
                  </strong>

                  <span>
                    {vehicle.vyrobce ?? "-"}
                  </span>

                  <span>
                    {vehicle.typ ?? "-"}
                  </span>

                  <span>
                    {vehicle.spz ?? "-"}
                  </span>

                  <span>
                    {vehicle.rok ?? "-"}
                  </span>

                  <span>
                    <span
                      className="status"
                      style={getStatusStyle(
                        vehicle.stav
                      )}
                    >
                      {vehicle.stav ?? "-"}
                    </span>
                  </span>
                </div>
              )
            )}

            {filteredVehicles.length ===
              0 && (
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

/* =========================================================
   ADMINISTRACE VOZŮ
========================================================= */

function AdminVehicles() {
  const emptyForm = {
    cislo: "",
    vyrobce: "",
    typ: "",
    spz: "",
    rok: "",
    barevne_schema: "",
    stav: "PROVOZNÍ",
    provozovna_id: "",
  };

  const [vehicles, setVehicles] = useState([]);
  const [provozovny, setProvozovny] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* -------------------------------------------------------
     NAČTENÍ VOZŮ
  ------------------------------------------------------- */

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("vozy")
        .select(
          "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id, vytvoreno"
        )
        .order("cislo", {
          ascending: true,
        });

    console.log(
      "ADMIN VOZY:",
      data
    );

    console.log(
      "ADMIN ERROR:",
      error
    );

    if (error) {
      setError(error.message);
      setVehicles([]);
    } else {
      setVehicles(data || []);
    }

    setLoading(false);
  }

  /* -------------------------------------------------------
     NAČTENÍ PROVOZOVEN
  ------------------------------------------------------- */

  async function loadProvozovny() {
    const { data, error } =
      await supabase
        .from("provozovny")
        .select("id, nazev")
        .order("nazev", {
          ascending: true,
        });

    console.log(
      "PROVOZOVNY DATA:",
      data
    );

    console.log(
      "PROVOZOVNY ERROR:",
      error
    );

    if (error) {
      console.error(
        "CHYBA PROVOZOVEN:",
        error
      );

      return;
    }

    setProvozovny(data || []);
  }

  useEffect(() => {
    loadVehicles();
    loadProvozovny();
  }, []);

  /* -------------------------------------------------------
     ZMĚNA FORMULÁŘE
  ------------------------------------------------------- */

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* -------------------------------------------------------
     ZAČÍT EDITACI
  ------------------------------------------------------- */

  function startEdit(vehicle) {
    setEditingId(vehicle.id);

    setForm({
      cislo:
        vehicle.cislo !== null &&
        vehicle.cislo !== undefined
          ? String(vehicle.cislo)
          : "",

      vyrobce:
        vehicle.vyrobce ?? "",

      typ:
        vehicle.typ ?? "",

      spz:
        vehicle.spz ?? "",

      rok:
        vehicle.rok !== null &&
        vehicle.rok !== undefined
          ? String(vehicle.rok)
          : "",

      barevne_schema:
        vehicle.barevne_schema ?? "",

      stav:
        vehicle.stav ??
        "PROVOZNÍ",

      provozovna_id:
        vehicle.provozovna_id !==
          null &&
        vehicle.provozovna_id !==
          undefined
          ? String(
              vehicle.provozovna_id
            )
          : "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* -------------------------------------------------------
     ZRUŠIT EDITACI
  ------------------------------------------------------- */

  function cancelEdit() {
    setEditingId(null);
    setForm({
      ...emptyForm,
    });
    setError("");
    setSuccess("");
  }

  /* -------------------------------------------------------
     ULOŽENÍ VOZU
  ------------------------------------------------------- */

  async function saveVehicle(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const vehicleData = {
      cislo:
        form.cislo.trim() !== ""
          ? Number(form.cislo)
          : null,

      vyrobce:
        form.vyrobce.trim() !== ""
          ? form.vyrobce.trim()
          : null,

      typ:
        form.typ.trim() !== ""
          ? form.typ.trim()
          : null,

      spz:
        form.spz.trim() !== ""
          ? form.spz.trim()
          : null,

      rok:
        form.rok.trim() !== ""
          ? Number(form.rok)
          : null,

      barevne_schema:
        form.barevne_schema.trim() !==
        ""
          ? form.barevne_schema.trim()
          : null,

      stav:
        form.stav.trim() !== ""
          ? form.stav.trim()
          : null,

      provozovna_id:
        form.provozovna_id.trim() !==
        ""
          ? form.provozovna_id.trim()
          : null,
    };

    console.log(
      "ODESÍLANÁ DATA:",
      vehicleData
    );

    let result;

    if (editingId !== null) {
      result = await supabase
        .from("vozy")
        .update(vehicleData)
        .eq("id", editingId)
        .select();
    } else {
      result = await supabase
        .from("vozy")
        .insert([vehicleData])
        .select();
    }

    console.log(
      "SUPABASE RESULT:",
      result
    );

    if (result.error) {
      console.error(
        "CHYBA ULOŽENÍ:",
        result.error
      );

      setError(
        result.error.message ||
          "Nepodařilo se uložit vůz."
      );

      setSaving(false);
      return;
    }

    if (editingId !== null) {
      setSuccess(
        "Vůz byl úspěšně upraven."
      );
    } else {
      setSuccess(
        "Vůz byl úspěšně přidán."
      );
    }

    setForm({
      ...emptyForm,
    });

    setEditingId(null);

    await loadVehicles();

    setSaving(false);
  }

  /* -------------------------------------------------------
     SMAZÁNÍ VOZU
  ------------------------------------------------------- */

  async function deleteVehicle(
    id,
    cislo
  ) {
    const confirmed =
      window.confirm(
        `Opravdu chceš smazat vůz ${
          cislo ?? ""
        }?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } =
      await supabase
        .from("vozy")
        .delete()
        .eq("id", id);

    console.log(
      "DELETE ERROR:",
      error
    );

    if (error) {
      console.error(error);

      setError(
        error.message ||
          "Nepodařilo se smazat vůz."
      );

      return;
    }

    setSuccess(
      "Vůz byl úspěšně smazán."
    );

    if (editingId === id) {
      cancelEdit();
    }

    await loadVehicles();
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>
            Administrace vozů
          </h1>

          <p>
            Přidávání, úprava a mazání
            vozů
          </p>
        </div>

        <div className="profile-badge">
          ADMIN
        </div>
      </div>

      {/* FORMULÁŘ */}

      <div className="panel admin-form-panel">
        <h2>
          {editingId !== null
            ? "✏️ Upravit vůz"
            : "➕ Přidat nový vůz"}
        </h2>

        {error && (
          <div className="error-box">
            <strong>Chyba:</strong>

            <br />

            {error}
          </div>
        )}

        {success && (
          <div className="success-box">
            {success}
          </div>
        )}

        <form
          onSubmit={saveVehicle}
          className="vehicle-form"
        >
          <div className="form-grid">
            <div>
              <label>
                Číslo vozu
              </label>

              <input
                name="cislo"
                type="number"
                value={form.cislo}
                onChange={
                  handleChange
                }
                placeholder="Např. 101"
                required
              />
            </div>

            <div>
              <label>
                Výrobce
              </label>

              <input
                name="vyrobce"
                type="text"
                value={
                  form.vyrobce
                }
                onChange={
                  handleChange
                }
                placeholder="Např. Škoda"
                required
              />
            </div>

            <div>
              <label>
                Typ
              </label>

              <input
                name="typ"
                type="text"
                value={form.typ}
                onChange={
                  handleChange
                }
                placeholder="Např. 12T"
                required
              />
            </div>

            <div>
              <label>
                SPZ
              </label>

              <input
                name="spz"
                type="text"
                value={form.spz}
                onChange={
                  handleChange
                }
                placeholder="1AA 1234"
              />
            </div>

            <div>
              <label>
                Rok výroby
              </label>

              <input
                name="rok"
                type="number"
                min="1900"
                max="2100"
                value={form.rok}
                onChange={
                  handleChange
                }
                placeholder="2026"
              />
            </div>

            <div>
              <label>
                Barevné schéma
              </label>

              <input
                name="barevne_schema"
                type="text"
                value={
                  form.barevne_schema
                }
                onChange={
                  handleChange
                }
                placeholder="Např. modro-bílé"
              />
            </div>

            <div>
              <label>
                Stav
              </label>

              <select
                name="stav"
                value={form.stav}
                onChange={
                  handleChange
                }
              >
                {VEHICLE_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <div
                className="status-preview"
                style={getStatusStyle(
                  form.stav
                )}
              >
                {form.stav}
              </div>
            </div>

            <div>
              <label>
                Provozovna
              </label>

              <select
                name="provozovna_id"
                value={
                  form.provozovna_id
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Vyber provozovnu
                </option>

                {provozovny.map(
                  (provozovna) => (
                    <option
                      key={
                        provozovna.id
                      }
                      value={
                        provozovna.id
                      }
                    >
                      {
                        provozovna.nazev
                      }
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Ukládání..."
                : editingId !== null
                ? "💾 Uložit změny"
                : "➕ Přidat vůz"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  cancelEdit
                }
                disabled={saving}
              >
                Zrušit úpravu
              </button>
            )}
          </div>
        </form>
      </div>

      {/* SEZNAM VOZŮ */}

      <div className="panel admin-list-panel">
        <div className="admin-list-title">
          <div>
            <h2>
              Vozový park
            </h2>

            <p>
              Celkem{" "}
              {vehicles.length} vozů
            </p>
          </div>
        </div>

        {loading && (
          <div className="empty">
            Načítání vozů...
          </div>
        )}

        {!loading &&
          vehicles.length === 0 && (
            <div className="empty">
              Zatím zde nejsou žádné
              vozy.
            </div>
          )}

        {!loading &&
          vehicles.length > 0 && (
            <div className="admin-vehicle-list">
              {vehicles.map(
                (vehicle) => (
                  <div
                    className="admin-vehicle-row"
                    key={vehicle.id}
                  >
                    <div className="vehicle-main">
                      <strong>
                        {vehicle.cislo ??
                          "-"}
                      </strong>

                      <div>
                        <b>
                          {vehicle.vyrobce ??
                            "-"}
                        </b>

                        <span>
                          {vehicle.typ ??
                            "-"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <small>
                        SPZ
                      </small>

                      <strong>
                        {vehicle.spz ??
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Rok
                      </small>

                      <strong>
                        {vehicle.rok ??
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Stav
                      </small>

                      <span
                        className="status"
                        style={getStatusStyle(
                          vehicle.stav
                        )}
                      >
                        {vehicle.stav ??
                          "-"}
                      </span>
                    </div>

                    <div className="admin-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          startEdit(
                            vehicle
                          )
                        }
                      >
                        ✏️ Upravit
                      </button>

                      <button
                        type="button"
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
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] =
    useState("dashboard");

  useEffect(() => {
    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(
            session?.user ?? null
          );

          if (!session?.user) {
            setPage(
              "dashboard"
            );
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const {
      data,
      error,
    } =
      await supabase.auth.getUser();

    if (error) {
      console.error(
        "SESSION ERROR:",
        error
      );
    }

    setUser(
      data?.user ?? null
    );

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
        <style>
          {styles}
        </style>

        <div className="loading">
          Načítání...
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>
          {styles}
        </style>

        <Login
          onLogin={(
            loggedUser
          ) => {
            setUser(
              loggedUser
            );
          }}
        />
      </>
    );
  }

  const isAdmin =
    user.email?.toLowerCase() ===
    ADMIN_EMAIL.toLowerCase();

  return (
    <>
      <style>
        {styles}
      </style>

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
              type="button"
              className={
                page ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "dashboard"
                )
              }
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              type="button"
              className={
                page ===
                "departures"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "departures"
                )
              }
            >
              <span>◈</span>
              Výpravy
            </button>

            <button
              type="button"
              className={
                page ===
                "vehicles"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "vehicles"
                )
              }
            >
              <span>▣</span>
              Vozy
            </button>

            <button
              type="button"
              className={
                page ===
                "reports"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(
                  "reports"
                )
              }
            >
              <span>▤</span>
              Moje výkazy
            </button>

            {isAdmin && (
              <button
                type="button"
                className={
                  page ===
                  "admin"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(
                    "admin"
                  )
                }
              >
                <span>⚙</span>
                Administrace
              </button>
            )}
          </nav>

          <div className="user-box">
            <div className="avatar">
              {(
                user.email ||
                "U"
              )
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
              type="button"
              className="logout"
              onClick={
                logout
              }
            >
              Odhlásit
            </button>
          </div>
        </aside>

        <main className="content">
          {page ===
            "dashboard" && (
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
                  </strong>
                  .
                </p>
              </div>
            </>
          )}

          {page ===
            "departures" && (
            <div className="panel">
              <h1>
                Výpravy
              </h1>

              <p>
                Tady budou výpravy
                vozů.
              </p>
            </div>
          )}

          {page ===
            "vehicles" && (
            <Vehicles />
          )}

          {page ===
            "reports" && (
            <div className="panel">
              <h1>
                Moje výkazy
              </h1>

              <p>
                Zde budou výkazy
                přihlášeného
                řidiče.
              </p>
            </div>
          )}

          {page ===
            "admin" &&
            isAdmin && (
              <AdminVehicles />
            )}
        </main>
      </div>
    </>
  );
}

/* =========================================================
   STYLY
========================================================= */

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

button {
  user-select: none;
}

/* LOGIN */

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 390px;
  max-width: 100%;
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
  outline: none;
}

.login-box input:focus {
  border-color: #2563eb;
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

.login-box form button:disabled {
  opacity: .6;
  cursor: not-allowed;
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
  z-index: 10;
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
  flex-shrink: 0;
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
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
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
  white-space: nowrap;
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

/* VOZY */

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
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
}

.status-preview {
  display: inline-block;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: 20px;
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
  overflow-wrap: anywhere;
}

.success-box {
  padding: 15px;
  border-radius: 9px;
  background: #dcfce7;
  color: #15803d;
  margin-bottom: 20px;
}

/* ADMIN FORM */

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
  flex-wrap: wrap;
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

.primary-button:hover {
  background: #1d4ed8;
}

.primary-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.secondary-button {
  background: #e5e7eb;
  color: #374151;
}

.secondary-button:hover {
  background: #d1d5db;
}

/* ADMIN LIST */

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
  grid-template-columns: 2fr 1fr .7fr 1fr auto;
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
  min-width: 0;
}

.vehicle-main > strong {
  min-width: 55px;
  font-size: 18px;
}

.vehicle-main div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.vehicle-main b {
  overflow: hidden;
  text-overflow: ellipsis;
}

.vehicle-main span {
  color: #718096;
  font-size: 12px;
}

.admin-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.edit-button {
  background: #dbeafe;
  color: #1d4ed8;
}

.edit-button:hover {
  background: #bfdbfe;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
}

.delete-button:hover {
  background: #fecaca;
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

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
    padding: 25px;
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

  .admin-actions {
    grid-column: auto;
  }

  .vehicle-header,
  .vehicle-row {
    grid-template-columns: 60px 1fr 1fr;
    gap: 8px;
  }

  .panel {
    padding: 18px;
  }
}
`;

export default App;
