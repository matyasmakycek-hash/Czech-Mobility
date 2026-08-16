import { useEffect, useState } from "react";
import { supabase } from "./supabase";

/* =========================================================
   ROLE
========================================================= */

const ROLE_ADMIN = "admin";
const ROLE_DISPECER = "dispecer";
const ROLE_RIDIC = "ridic";

function canManageVehicles(role) {
  return role === ROLE_ADMIN || role === ROLE_DISPECER;
}

function canManageReports(role) {
  return role === ROLE_ADMIN || role === ROLE_DISPECER;
}

function canManageUsers(role) {
  return role === ROLE_ADMIN;
}

function canUseReports(role) {
  return (
    role === ROLE_ADMIN ||
    role === ROLE_DISPECER ||
    role === ROLE_RIDIC
  );
}

function getRoleName(role) {
  if (role === ROLE_ADMIN) return "Administrátor";
  if (role === ROLE_DISPECER) return "Dispečer";
  if (role === ROLE_RIDIC) return "Řidič";
  return "Neznámá role";
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin, onRegister }) {
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
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
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

        <button
          type="button"
          className="register-back"
          onClick={onRegister}
        >
          Nemáš účet? Zaregistrovat se
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRACE
========================================================= */

function Register({ onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků.");
      return;
    }

    if (password !== password2) {
      setError("Hesla se neshodují.");
      return;
    }

    setLoading(true);

    const {
      data: invite,
      error: inviteError,
    } = await supabase
      .from("user_invites")
      .select("id, email, jmeno, role, used")
      .eq("email", cleanEmail)
      .eq("used", false)
      .maybeSingle();

    if (inviteError) {
      setError(inviteError.message);
      setLoading(false);
      return;
    }

    if (!invite) {
      setError(
        "Tento e-mail nebyl pozván administrátorem."
      );
      setLoading(false);
      return;
    }

    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError("Účet se nepodařilo vytvořit.");
      setLoading(false);
      return;
    }

    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        jmeno: invite.jmeno || cleanName,
        role: invite.role || ROLE_RIDIC,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const {
      error: inviteUpdateError,
    } = await supabase
      .from("user_invites")
      .update({ used: true })
      .eq("id", invite.id);

    if (inviteUpdateError) {
      console.error(inviteUpdateError);
    }

    setSuccess(
      "Registrace byla úspěšná. Nyní se můžeš přihlásit."
    );

    setLoading(false);

    setTimeout(() => {
      onBack();
    }, 1500);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">CM</div>

        <h1>Registrace</h1>

        <p>
          Použij e-mail, který ti přidělil
          administrátor.
        </p>

        <form onSubmit={handleRegister}>
          <label>Jméno</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tvoje jméno"
            required
          />

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
            placeholder="Min. 6 znaků"
            required
          />

          <label>Heslo znovu</label>

          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Zopakuj heslo"
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {success && (
            <div className="success-box">
              {success}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Registrace..."
              : "Zaregistrovat se"}
          </button>
        </form>

        <button
          type="button"
          className="register-back"
          onClick={onBack}
        >
          Zpět na přihlášení
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   UŽIVATELÉ
========================================================= */

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState("Vše");

  const emptyForm = {
    jmeno: "",
    email: "",
    role: ROLE_RIDIC,
  };

  const [form, setForm] = useState(emptyForm);

  async function loadUsers() {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("id, jmeno, role, created_at")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }

  async function loadInvites() {
    const {
      data,
      error,
    } = await supabase
      .from("user_invites")
      .select(
        "id, email, jmeno, role, used, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("INVITES ERROR:", error);
      return;
    }

    setInvites(data || []);
  }

  useEffect(() => {
    loadUsers();
    loadInvites();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function createInvite(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    const name = form.jmeno.trim();

    if (!name || !email) {
      setError("Vyplň jméno a e-mail.");
      setSaving(false);
      return;
    }

    const {
      data: existingInvite,
    } = await supabase
      .from("user_invites")
      .select("id")
      .eq("email", email)
      .eq("used", false)
      .maybeSingle();

    if (existingInvite) {
      setError(
        "Pro tento e-mail už existuje aktivní pozvánka."
      );
      setSaving(false);
      return;
    }

    const {
      error,
    } = await supabase
      .from("user_invites")
      .insert({
        email,
        jmeno: name,
        role: form.role,
        used: false,
      });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      `Pozvánka pro ${name} byla vytvořena.`
    );

    setForm(emptyForm);
    setShowForm(false);

    await loadInvites();

    setSaving(false);
  }

  async function changeRole(id, role) {
    setError("");
    setSuccess("");

    const {
      error,
    } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Role uživatele byla změněna.");

    await loadUsers();
  }

  async function deleteInvite(id) {
    if (
      !window.confirm(
        "Opravdu chceš tuto pozvánku smazat?"
      )
    ) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("user_invites")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Pozvánka byla smazána.");

    await loadInvites();
  }

  const filteredUsers = users.filter(
    (user) =>
      filterRole === "Vše" ||
      user.role === filterRole
  );

  const pendingInvites = invites.filter(
    (invite) => !invite.used
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Správa uživatelů</h1>
          <p>Správa účtů a uživatelských rolí</p>
        </div>

        <div className="profile-badge">
          POUZE ADMIN
        </div>
      </div>

      <div className="admin-user-stats">
        <div className="admin-user-stat">
          <span>Celkem uživatelů</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-user-stat">
          <span>Administrátoři</span>
          <strong>
            {
              users.filter(
                (u) => u.role === ROLE_ADMIN
              ).length
            }
          </strong>
        </div>

        <div className="admin-user-stat">
          <span>Dispečeři</span>
          <strong>
            {
              users.filter(
                (u) =>
                  u.role === ROLE_DISPECER
              ).length
            }
          </strong>
        </div>

        <div className="admin-user-stat">
          <span>Řidiči</span>
          <strong>
            {
              users.filter(
                (u) => u.role === ROLE_RIDIC
              ).length
            }
          </strong>
        </div>
      </div>

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

      <div className="panel">
        <div className="users-toolbar">
          <div>
            <h2>Uživatelé</h2>
            <p className="muted">
              Registrované účty.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              setShowForm(!showForm)
            }
          >
            {showForm
              ? "✕ Zavřít"
              : "➕ Přidat uživatele"}
          </button>
        </div>

        {showForm && (
          <div className="user-create-box">
            <h3>➕ Přidat uživatele</h3>

            <p>
              Vytvoříš pozvánku. Uživatel se následně
              zaregistruje pomocí tohoto e-mailu.
            </p>

            <form onSubmit={createInvite}>
              <div className="form-grid">
                <div>
                  <label>Jméno</label>

                  <input
                    name="jmeno"
                    value={form.jmeno}
                    onChange={handleChange}
                    placeholder="Např. Petr Novák"
                    required
                  />
                </div>

                <div>
                  <label>E-mail</label>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="petr@email.cz"
                    required
                  />
                </div>

                <div>
                  <label>Role</label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value={ROLE_RIDIC}>
                      Řidič
                    </option>

                    <option value={ROLE_DISPECER}>
                      Dispečer
                    </option>

                    <option value={ROLE_ADMIN}>
                      Administrátor
                    </option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Vytváření..."
                    : "✓ Vytvořit pozvánku"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="user-filter">
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value)
            }
          >
            <option value="Vše">
              Všechny role
            </option>

            <option value={ROLE_ADMIN}>
              Administrátoři
            </option>

            <option value={ROLE_DISPECER}>
              Dispečeři
            </option>

            <option value={ROLE_RIDIC}>
              Řidiči
            </option>
          </select>
        </div>

        {loading ? (
          <div className="empty">
            Načítání uživatelů...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty">
            Žádní uživatelé.
          </div>
        ) : (
          <div className="users-list">
            {filteredUsers.map((user) => (
              <div
                className="user-card"
                key={user.id}
              >
                <div className="user-card-avatar">
                  {(user.jmeno || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-card-main">
                  <strong>
                    {user.jmeno || "Bez jména"}
                  </strong>

                  <small>
                    ID: {user.id}
                  </small>
                </div>

                <div>
                  <small>Role</small>

                  <strong>
                    {getRoleName(user.role)}
                  </strong>
                </div>

                <div>
                  <small>Vytvořeno</small>

                  <strong>
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString(
                          "cs-CZ"
                        )
                      : "-"}
                  </strong>
                </div>

                <select
                  value={
                    user.role || ROLE_RIDIC
                  }
                  onChange={(e) =>
                    changeRole(
                      user.id,
                      e.target.value
                    )
                  }
                >
                  <option value={ROLE_RIDIC}>
                    Řidič
                  </option>

                  <option value={ROLE_DISPECER}>
                    Dispečer
                  </option>

                  <option value={ROLE_ADMIN}>
                    Administrátor
                  </option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Čekající registrace</h2>

        <p className="muted">
          Pozvánky, které ještě nebyly použity.
        </p>

        {pendingInvites.length === 0 ? (
          <div className="empty">
            Žádné čekající registrace.
          </div>
        ) : (
          <div className="users-list">
            {pendingInvites.map((invite) => (
              <div
                className="user-card"
                key={invite.id}
              >
                <div className="user-card-avatar pending-avatar">
                  {(invite.jmeno || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-card-main">
                  <strong>
                    {invite.jmeno}
                  </strong>

                  <small>
                    {invite.email}
                  </small>
                </div>

                <div>
                  <small>Role</small>

                  <strong>
                    {getRoleName(invite.role)}
                  </strong>
                </div>

                <span className="pending-label">
                  Čeká na registraci
                </span>

                <button
                  className="delete-button"
                  onClick={() =>
                    deleteInvite(invite.id)
                  }
                >
                  🗑️ Zrušit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   VOZY
========================================================= */

const vehicleStatusColors = {
  PROVOZNÍ: "#caffca",
  "V DÍLNĚ / V OPRAVĚ": "#ffca97",
  "DOČASNĚ ODSTAVEN": "#eaeaea",
  "DLOUHODOBĚ/ DEFINITIVNĚ ODSTAVEN": "#cacaca",
  "DLOUHODOBĚ ODSTAVEN": "#cacaca",
  SEŠROTOVÁN: "#ffcaca",
  "PRODÁN / PŘEDÁN JINÉMU DOPRAVCI": "#ffcaff",
  "PRODÁN / PŘEDÁN JINEMU DOPRAVCI": "#ffcaff",
  "DOSUD NEZAŘAZEN DO PROVOZU": "#cacaff",
  SLUŽEBNÍ: "#ffffca",
  RETRO: "#caffff",
};

function VehicleStatus({ status }) {
  const color =
    vehicleStatusColors[status] ||
    "#eaeaea";

  return (
    <span
      className="status vehicle-status"
      style={{
        background: color,
      }}
    >
      {status || "-"}
    </span>
  );
}

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const {
      data,
      error,
    } = await supabase
      .from("vozy")
      .select(
        "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id, vytvoreno"
      )
      .order("cislo", {
        ascending: true,
      });

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
      const text = [
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

      return text.includes(
        search.toLowerCase()
      );
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
            <strong>Chyba:</strong>
            <br />
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredVehicles.length > 0 && (
            <>
              <div className="vehicle-header">
                <span>Číslo</span>
                <span>Výrobce</span>
                <span>Typ</span>
                <span>SPZ</span>
                <span>Rok</span>
                <span>Stav</span>
              </div>

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

                    <VehicleStatus
                      status={vehicle.stav}
                    />
                  </div>
                )
              )}
            </>
          )}

        {!loading &&
          !error &&
          filteredVehicles.length === 0 && (
            <div className="empty">
              {vehicles.length === 0
                ? "Tabulka vozy neobsahuje žádné záznamy."
                : "Žádné vozy neodpovídají hledání."}
            </div>
          )}
      </div>
    </div>
  );
}

/* =========================================================
   VÝKAZY
========================================================= */

function Reports({ admin = false }) {
  return (
    <div>
      <div className="topbar">
        <div>
          <h1>
            {admin
              ? "Správa výkazů"
              : "Moje výkazy"}
          </h1>

          <p>
            {admin
              ? "Administrace výkazů řidičů"
              : "Výkazy přihlášeného uživatele"}
          </p>
        </div>

        <div className="profile-badge">
          {admin
            ? "POUZE ADMIN / DISPEČER"
            : "VÝKAZY"}
        </div>
      </div>

      <div className="panel">
        <h2>
          {admin
            ? "Správa výkazů"
            : "Moje výkazy"}
        </h2>

        <p className="muted">
          {admin
            ? "Zde budou všechny výkazy řidičů."
            : "Zde se budou zobrazovat pouze výkazy tohoto uživatele."}
        </p>

        <div className="empty">
          Zatím žádné výkazy.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMINISTRACE VOZŮ
========================================================= */

function AdminVehicles() {
  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Administrace vozů</h1>
          <p>
            Správa vozového parku Czech Mobility
          </p>
        </div>

        <div className="profile-badge">
          POUZE ADMIN / DISPEČER
        </div>
      </div>

      <div className="panel">
        <h2>Administrace vozů</h2>

        <p className="muted">
          Zde bude možné přidávat, upravovat
          a mazat vozy.
        </p>

        <div className="empty">
          Administrace vozů je připravena.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ profile, user, roleName }) {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>

          <p>
            Informační systém Czech Mobility
          </p>
        </div>

        <div className="profile-badge">
          {roleName}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Dnešní výpravy</span>
          <strong>0</strong>
        </div>

        <div className="stat">
          <span>Aktivní vozy</span>
          <strong>14</strong>
        </div>

        <div className="stat">
          <span>Vozy celkem</span>
          <strong>42</strong>
        </div>

        <div className="stat">
          <span>Provozovny</span>
          <strong>1</strong>
        </div>
      </div>

      <div className="panel">
        <h2>
          Vítej,{" "}
          {profile?.jmeno || user.email} 👋
        </h2>

        <p>
          Jsi přihlášen jako{" "}
          <strong>
            {roleName.toLowerCase()}
          </strong>
          .
        </p>
      </div>
    </>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(false);

  const [page, setPage] =
    useState("dashboard");

  const [showRegister, setShowRegister] =
    useState(false);

  async function loadProfile(authUser) {
    if (!authUser) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id, jmeno, role, created_at"
      )
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error(
        "PROFILE ERROR:",
        error
      );

      setProfile(null);
    } else {
      setProfile(data || null);
    }

    setProfileLoading(false);
  }

  async function checkSession() {
    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(
        "SESSION ERROR:",
        error
      );
    }

    const loggedUser =
      data?.user || null;

    setUser(loggedUser);

    if (loggedUser) {
      await loadProfile(loggedUser);
    }

    setLoading(false);
  }

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          const loggedUser =
            session?.user || null;

          setUser(loggedUser);

          if (!loggedUser) {
            setProfile(null);
            setPage("dashboard");
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(loggedUser) {
    setUser(loggedUser);
    await loadProfile(loggedUser);
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setPage("dashboard");
  }

  if (loading || profileLoading) {
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

        {showRegister ? (
          <Register
            onBack={() =>
              setShowRegister(false)
            }
          />
        ) : (
          <Login
            onLogin={handleLogin}
            onRegister={() =>
              setShowRegister(true)
            }
          />
        )}
      </>
    );
  }

  const role =
    profile?.role?.toLowerCase() || "";

  const roleName =
    getRoleName(role);

  const manageVehicles =
    canManageVehicles(role);

  const manageReports =
    canManageReports(role);

  const manageUsers =
    canManageUsers(role);

  const useReports =
    canUseReports(role);

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

            {useReports && (
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
            )}

            {(manageVehicles ||
              manageReports ||
              manageUsers) && (
              <>
                <div className="menu-divider" />

                <div className="menu-section-label">
                  Administrace
                </div>
              </>
            )}

            {manageVehicles && (
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
                Administrace vozů
              </button>
            )}

            {manageReports && (
              <button
                className={
                  page === "adminReports"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("adminReports")
                }
              >
                <span>📋</span>
                Správa výkazů
              </button>
            )}

            {manageUsers && (
              <button
                className={
                  page === "adminUsers"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("adminUsers")
                }
              >
                <span>👥</span>
                Správa uživatelů
              </button>
            )}
          </nav>

          <div className="user-box">
            <div className="avatar">
              {(
                profile?.jmeno ||
                user.email ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">
              <div className="user-name">
                {profile?.jmeno ||
                  user.email}
              </div>

              <div className="user-role">
                {roleName}
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
            <Dashboard
              profile={profile}
              user={user}
              roleName={roleName}
            />
          )}

          {page === "departures" && (
            <div className="panel">
              <h1>Výpravy</h1>

              <p className="muted">
                Tady budou výpravy vozů.
              </p>

              <div className="empty">
                Zatím žádné výpravy.
              </div>
            </div>
          )}

          {page === "vehicles" && (
            <Vehicles />
          )}

          {page === "reports" &&
            useReports && (
              <Reports />
            )}

          {page === "admin" &&
            manageVehicles && (
              <AdminVehicles />
            )}

          {page === "adminReports" &&
            manageReports && (
              <Reports admin />
            )}

          {page === "adminUsers" &&
            manageUsers && (
              <AdminUsers />
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

.login-error {
  color: #dc2626;
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  margin-top: 15px;
}

.register-back {
  width: 100%;
  border: 0;
  background: transparent;
  color: #2563eb;
  margin-top: 15px;
  cursor: pointer;
  font-weight: 700;
}

.success-box {
  padding: 15px;
  border-radius: 9px;
  background: #dcfce7;
  color: #15803d;
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

.menu-divider {
  height: 1px;
  background: #273245;
  margin: 14px 8px 10px;
}

.menu-section-label {
  color: #69758a;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0 12px 5px;
}

.user-box {
  margin-top: auto;
  border-top: 1px solid #273245;
  padding: 15px 5px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.avatar,
.user-card-avatar {
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

.stats,
.admin-user-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 25px 0;
}

.stat,
.admin-user-stat {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
}

.stat span,
.admin-user-stat span {
  color: #718096;
  font-size: 13px;
}

.stat strong,
.admin-user-stat strong {
  display: block;
  font-size: 30px;
  margin-top: 10px;
}

.panel {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
  margin-bottom: 25px;
}

.panel h2 {
  margin-top: 0;
}

.muted {
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

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.primary-button,
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

.primary-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
}

/* USERS */

.users-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.users-toolbar h2 {
  margin-bottom: 5px;
}

.user-create-box {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 12px;
}

.user-create-box h3 {
  margin-top: 0;
}

.user-filter {
  margin: 20px 0;
}

.user-filter select,
.user-card select {
  padding: 10px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  background: white;
}

.users-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #edf0f5;
}

.user-card {
  display: grid;
  grid-template-columns: auto 2fr 1fr 1fr 170px;
  gap: 20px;
  align-items: center;
  padding: 16px 5px;
  border-bottom: 1px solid #edf0f5;
}

.user-card-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-card small {
  display: block;
  color: #718096;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.pending-avatar {
  background: #f59e0b;
}

.pending-label {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 20px;
  background: #fef3c7;
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
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
}

.vehicle-status {
  white-space: nowrap;
}

/* FORM */

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

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 25px;
  flex-wrap: wrap;
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .stats,
  .admin-user-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-card {
    grid-template-columns: auto 1fr 1fr;
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

  .form-grid {
    grid-template-columns: 1fr;
  }

  .vehicle-header,
  .vehicle-row {
    grid-template-columns: 1fr 1fr;
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

  .stats,
  .admin-user-stats {
    grid-template-columns: 1fr;
  }

  .users-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .user-card {
    grid-template-columns: auto 1fr;
  }

  .panel {
    padding: 18px;
  }
}
`;

export default App;
