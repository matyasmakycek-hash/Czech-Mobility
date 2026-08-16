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

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Přihlašování..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTRACE
========================================================= */

function Register({ onRegistered }) {
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

    const { data: invite, error: inviteError } =
      await supabase
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
      setError("Tento e-mail nebyl pozván administrátorem.");
      setLoading(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError("Účet se nepodařilo vytvořit.");
      setLoading(false);
      return;
    }

    const { error: profileError } =
      await supabase.from("profiles").insert({
        id: data.user.id,
        jmeno: invite.jmeno || cleanName,
        role: invite.role,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("user_invites")
      .update({ used: true })
      .eq("id", invite.id);

    setSuccess(
      "Registrace byla úspěšná. Nyní se můžeš přihlásit."
    );

    setLoading(false);

    setTimeout(() => {
      onRegistered();
    }, 1500);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">CM</div>

        <h1>Registrace</h1>

        <p>
          Zaregistruj se pomocí e-mailu,
          který ti přidělil administrátor.
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

          {error && <div className="login-error">{error}</div>}

          {success && <div className="success-box">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Registrace..." : "Zaregistrovat se"}
          </button>
        </form>

        <button
          type="button"
          className="register-back"
          onClick={onRegistered}
        >
          Zpět na přihlášení
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PROVOZOVNY
========================================================= */

function useProvozovny() {
  const [provozovny, setProvozovny] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadProvozovny() {
    setLoading(true);

    const { data, error } = await supabase
      .from("provozovny")
      .select("id, nazev, kod")
      .order("nazev", { ascending: true });

    if (!error) {
      setProvozovny(data || []);
    } else {
      console.error(error);
      setProvozovny([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProvozovny();
  }, []);

  return {
    provozovny,
    loading,
    reload: loadProvozovny,
  };
}

function ProvozovnaSelect({
  value,
  onChange,
  provozovny,
  label = "Provozovna",
  required = false,
}) {
  return (
    <div>
      <label>{label}</label>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Vyber provozovnu</option>

        {provozovny.map((provozovna) => (
          <option
            key={provozovna.id}
            value={provozovna.id}
          >
            {provozovna.nazev}
            {provozovna.kod
              ? ` (${provozovna.kod})`
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   SPRÁVA UŽIVATELŮ
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
    const { data, error } = await supabase
      .from("profiles")
      .select("id, jmeno, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
  }

  async function loadInvites() {
    const { data, error } = await supabase
      .from("user_invites")
      .select("id, email, jmeno, role, used, created_at")
      .order("created_at", { ascending: false });

    if (!error) {
      setInvites(data || []);
    }
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    await Promise.all([
      loadUsers(),
      loadInvites(),
    ]);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

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

    const { data: existingInvite } =
      await supabase
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

    const { data: existingProfile } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("jmeno", name)
        .maybeSingle();

    if (existingProfile) {
      setError("Uživatel s tímto jménem už existuje.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
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

    setSuccess(`Pozvánka pro ${name} byla vytvořena.`);
    setForm(emptyForm);
    setShowForm(false);

    await loadInvites();

    setSaving(false);
  }

  async function changeRole(id, role) {
    setError("");
    setSuccess("");

    const { error } = await supabase
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
    if (!window.confirm("Opravdu chceš tuto pozvánku zrušit?")) {
      return;
    }

    const { error } = await supabase
      .from("user_invites")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Pozvánka byla zrušena.");

    await loadInvites();
  }

  const filteredUsers = users.filter((user) => {
    return (
      filterRole === "Vše" ||
      user.role === filterRole
    );
  });

  const pendingInvites = invites.filter(
    (invite) => !invite.used
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Správa uživatelů</h1>
          <p>Správa účtů a rolí</p>
        </div>

        <div className="profile-badge">POUZE ADMIN</div>
      </div>

      <div className="admin-user-stats">
        <div className="admin-user-stat">
          <span>Celkem uživatelů</span>
          <strong>{users.length}</strong>
        </div>

        <div className="admin-user-stat">
          <span>Administrátoři</span>
          <strong>
            {users.filter((u) => u.role === ROLE_ADMIN).length}
          </strong>
        </div>

        <div className="admin-user-stat">
          <span>Dispečeři</span>
          <strong>
            {users.filter((u) => u.role === ROLE_DISPECER).length}
          </strong>
        </div>

        <div className="admin-user-stat">
          <span>Řidiči</span>
          <strong>
            {users.filter((u) => u.role === ROLE_RIDIC).length}
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

      {success && <div className="success-box">{success}</div>}

      <div className="panel">
        <div className="users-toolbar">
          <div>
            <h2>Uživatelé</h2>
            <p className="muted">
              Registrovaní uživatelé systému.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✕ Zavřít" : "➕ Přidat uživatele"}
          </button>
        </div>

        {showForm && (
          <div className="user-create-box">
            <h3>➕ Přidat uživatele</h3>

            <form onSubmit={createInvite}>
              <div className="form-grid">
                <div>
                  <label>Jméno</label>

                  <input
                    value={form.jmeno}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jmeno: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label>E-mail</label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label>Role</label>

                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value,
                      })
                    }
                  >
                    <option value={ROLE_RIDIC}>Řidič</option>
                    <option value={ROLE_DISPECER}>Dispečer</option>
                    <option value={ROLE_ADMIN}>
                      Administrátor
                    </option>
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
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="Vše">Vše</option>
            <option value={ROLE_ADMIN}>Administrátoři</option>
            <option value={ROLE_DISPECER}>Dispečeři</option>
            <option value={ROLE_RIDIC}>Řidiči</option>
          </select>
        </div>

        {loading && (
          <div className="empty">Načítání uživatelů...</div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="empty">Žádní uživatelé.</div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className="users-list">
            {filteredUsers.map((user) => (
              <div className="user-card" key={user.id}>
                <div className="user-card-avatar">
                  {(user.jmeno || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-card-main">
                  <strong>{user.jmeno || "Bez jména"}</strong>
                  <small>{user.id}</small>
                </div>

                <div>
                  <small>Role</small>
                  <strong>{getRoleName(user.role)}</strong>
                </div>

                <div>
                  <small>Vytvořeno</small>

                  <strong>
                    {user.created_at
                      ? new Date(
                          user.created_at
                        ).toLocaleDateString("cs-CZ")
                      : "-"}
                  </strong>
                </div>

                <select
                  value={user.role || ROLE_RIDIC}
                  onChange={(e) =>
                    changeRole(user.id, e.target.value)
                  }
                >
                  <option value={ROLE_RIDIC}>Řidič</option>
                  <option value={ROLE_DISPECER}>Dispečer</option>
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

        {pendingInvites.length === 0 ? (
          <div className="empty">
            Žádné čekající registrace.
          </div>
        ) : (
          <div className="users-list">
            {pendingInvites.map((invite) => (
              <div className="user-card" key={invite.id}>
                <div className="user-card-avatar pending-avatar">
                  {(invite.jmeno || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="user-card-main">
                  <strong>{invite.jmeno}</strong>
                  <small>{invite.email}</small>
                </div>

                <div>
                  <small>Role</small>
                  <strong>{getRoleName(invite.role)}</strong>
                </div>

                <span className="pending-label">
                  Čeká na registraci
                </span>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteInvite(invite.id)}
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
   STAVY VOZŮ
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
    vehicleStatusColors[status] || "#eaeaea";

  return (
    <span
      className="status vehicle-status"
      style={{
        background: color,
        color: "#172033",
      }}
    >
      {status || "-"}
    </span>
  );
}

/* =========================================================
   VOZIDLO - FORMULÁŘ
========================================================= */

const emptyVehicle = {
  cislo: "",
  vyrobce: "",
  typ: "",
  spz: "",
  rok: "",
  barevne_schema: "",
  stav: "PROVOZNÍ",
  provozovna_id: "",
};

function VehicleForm({
  initialData,
  onSave,
  onCancel,
  saving,
  provozovny,
}) {
  const [form, setForm] = useState(
    initialData || emptyVehicle
  );

  useEffect(() => {
    setForm(initialData || emptyVehicle);
  }, [initialData]);

  function change(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function submit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="crud-form">
      <h3>
        {initialData ? "✏️ Upravit vůz" : "➕ Přidat vůz"}
      </h3>

      <form onSubmit={submit}>
        <div className="form-grid">
          <div>
            <label>Číslo vozu</label>

            <input
              type="number"
              value={form.cislo}
              onChange={(e) => change("cislo", e.target.value)}
              required
            />
          </div>

          <div>
            <label>Výrobce</label>

            <input
              value={form.vyrobce}
              onChange={(e) =>
                change("vyrobce", e.target.value)
              }
              required
            />
          </div>

          <div>
            <label>Typ</label>

            <input
              value={form.typ}
              onChange={(e) => change("typ", e.target.value)}
              required
            />
          </div>

          <div>
            <label>SPZ</label>

            <input
              value={form.spz}
              onChange={(e) => change("spz", e.target.value)}
            />
          </div>

          <div>
            <label>Rok</label>

            <input
              type="number"
              value={form.rok}
              onChange={(e) => change("rok", e.target.value)}
            />
          </div>

          <div>
            <label>Barevné schéma</label>

            <input
              value={form.barevne_schema}
              onChange={(e) =>
                change(
                  "barevne_schema",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label>Stav</label>

            <select
              value={form.stav}
              onChange={(e) => change("stav", e.target.value)}
            >
              <option>PROVOZNÍ</option>
              <option>V DÍLNĚ / V OPRAVĚ</option>
              <option>DOČASNĚ ODSTAVEN</option>
              <option>DLOUHODOBĚ ODSTAVEN</option>
              <option>SEŠROTOVÁN</option>
              <option>
                PRODÁN / PŘEDÁN JINÉMU DOPRAVCI
              </option>
              <option>
                DOSUD NEZAŘAZEN DO PROVOZU
              </option>
              <option>SLUŽEBNÍ</option>
              <option>RETRO</option>
            </select>
          </div>

          <ProvozovnaSelect
            value={form.provozovna_id}
            onChange={(value) =>
              change("provozovna_id", value)
            }
            provozovny={provozovny}
            required
          />
        </div>

        <div className="form-buttons">
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Ukládání..." : "✓ Uložit"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   ADMINISTRACE VOZŮ
========================================================= */

function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedProvozovna, setSelectedProvozovna] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { provozovny } = useProvozovny();

  async function loadVehicles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vozy")
      .select(
        "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id, vytvoreno"
      )
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

  function getProvozovnaName(id) {
    return (
      provozovny.find((p) => Number(p.id) === Number(id))
        ?.nazev || "-"
    );
  }

  async function saveVehicle(form) {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      cislo:
        form.cislo === ""
          ? null
          : Number(form.cislo),

      vyrobce: form.vyrobce.trim(),
      typ: form.typ.trim(),
      spz: form.spz.trim() || null,

      rok:
        form.rok === ""
          ? null
          : Number(form.rok),

      barevne_schema:
        form.barevne_schema.trim() || null,

      stav: form.stav || null,

      provozovna_id:
        form.provozovna_id === ""
          ? null
          : Number(form.provozovna_id),
    };

    let result;

    if (editing) {
      result = await supabase
        .from("vozy")
        .update(payload)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("vozy")
        .insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editing ? "Vůz byl upraven." : "Vůz byl přidán."
    );

    setShowForm(false);
    setEditing(null);

    await loadVehicles();

    setSaving(false);
  }

  async function deleteVehicle(vehicle) {
    if (
      !window.confirm(
        `Opravdu chceš smazat vůz č. ${vehicle.cislo}?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("vozy")
      .delete()
      .eq("id", vehicle.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Vůz byl smazán.");

    await loadVehicles();
  }

  const filtered = vehicles.filter((vehicle) => {
    if (
      selectedProvozovna &&
      Number(vehicle.provozovna_id) !==
        Number(selectedProvozovna)
    ) {
      return false;
    }

    const text = [
      vehicle.cislo,
      vehicle.vyrobce,
      vehicle.typ,
      vehicle.spz,
      vehicle.rok,
      vehicle.barevne_schema,
      vehicle.stav,
      getProvozovnaName(vehicle.provozovna_id),
    ]
      .filter(
        (x) =>
          x !== null &&
          x !== undefined
      )
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Administrace vozů</h1>
          <p>Přidávání, úprava a mazání vozů</p>
        </div>

        <div className="profile-badge">
          {filtered.length} VOZŮ
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
        <div className="provozovna-bar">
          <ProvozovnaSelect
            value={selectedProvozovna}
            onChange={setSelectedProvozovna}
            provozovny={provozovny}
            label="Zobrazit provozovnu"
          />

          <button
            className="secondary-button"
            type="button"
            onClick={() => setSelectedProvozovna("")}
          >
            Všechny provozovny
          </button>
        </div>

        <div className="users-toolbar">
          <div>
            <h2>Vozový park</h2>
            <p className="muted">
              Správa vozidel Czech Mobility.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? "✕ Zavřít" : "➕ Přidat vůz"}
          </button>
        </div>

        {showForm && (
          <VehicleForm
            initialData={editing}
            onSave={saveVehicle}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
            provozovny={provozovny}
          />
        )}

        <input
          className="search"
          type="text"
          placeholder="🔎 Hledat vůz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && (
          <div className="empty">Načítání vozů...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty">Žádné vozy.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="admin-vehicles-list">
            {filtered.map((vehicle) => (
              <div
                className="admin-vehicle-card"
                key={vehicle.id}
              >
                <div className="vehicle-number">
                  {vehicle.cislo}
                </div>

                <div className="vehicle-main">
                  <strong>
                    {vehicle.vyrobce} {vehicle.typ}
                  </strong>

                  <small>
                    SPZ: {vehicle.spz || "-"} • Rok:{" "}
                    {vehicle.rok || "-"}
                  </small>

                  <small>
                    Provozovna:{" "}
                    {getProvozovnaName(
                      vehicle.provozovna_id
                    )}
                  </small>

                  <small>
                    Schéma:{" "}
                    {vehicle.barevne_schema || "-"}
                  </small>
                </div>

                <VehicleStatus status={vehicle.stav} />

                <div className="vehicle-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setEditing({
                        ...vehicle,
                        cislo:
                          vehicle.cislo ?? "",
                        rok:
                          vehicle.rok ?? "",
                        provozovna_id:
                          vehicle.provozovna_id ?? "",
                        spz: vehicle.spz || "",
                        barevne_schema:
                          vehicle.barevne_schema || "",
                      });

                      setShowForm(true);
                    }}
                  >
                    ✏️ Upravit
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() =>
                      deleteVehicle(vehicle)
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

/* =========================================================
   VEŘEJNÝ SEZNAM VOZŮ
========================================================= */

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProvozovna, setSelectedProvozovna] =
    useState("");

  const { provozovny } = useProvozovny();

  async function loadVehicles() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vozy")
      .select(
        "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id"
      )
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

  const filtered = vehicles.filter((vehicle) => {
    if (
      selectedProvozovna &&
      Number(vehicle.provozovna_id) !==
        Number(selectedProvozovna)
    ) {
      return false;
    }

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
        (x) =>
          x !== null &&
          x !== undefined
      )
      .join(" ")
      .toLowerCase();

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
          {filtered.length} VOZŮ
        </div>
      </div>

      <div className="panel">
        <div className="provozovna-bar">
          <ProvozovnaSelect
            value={selectedProvozovna}
            onChange={setSelectedProvozovna}
            provozovny={provozovny}
            label="Provozovna"
          />

          <button
            className="secondary-button"
            type="button"
            onClick={() => setSelectedProvozovna("")}
          >
            Všechny provozovny
          </button>
        </div>

        <input
          className="search"
          type="text"
          placeholder="🔎 Hledat vůz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && (
          <div className="empty">Načítání vozů...</div>
        )}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="vehicle-header">
              <span>Číslo</span>
              <span>Výrobce</span>
              <span>Typ</span>
              <span>SPZ</span>
              <span>Rok</span>
              <span>Stav</span>
            </div>

            {filtered.map((vehicle) => (
              <div
                className="vehicle-row"
                key={vehicle.id}
              >
                <strong>{vehicle.cislo}</strong>

                <span>{vehicle.vyrobce || "-"}</span>

                <span>{vehicle.typ || "-"}</span>

                <span>{vehicle.spz || "-"}</span>

                <span>{vehicle.rok || "-"}</span>

                <VehicleStatus status={vehicle.stav} />
              </div>
            ))}
          </>
        )}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <div className="empty">Žádné vozy.</div>
          )}
      </div>
    </div>
  );
}

/* =========================================================
   VÝKAZY
========================================================= */

const emptyReport = {
  uzivatel_id: "",
  provozovna_id: "",
  datum: "",
  linka: "",
  smer: "",
  vuz: "",
  zacatek: "",
  konec: "",
};

/* =========================================================
   FORMULÁŘ VÝKAZU
========================================================= */

function ReportForm({
  initialData,
  users,
  currentUserId,
  onSave,
  onCancel,
  saving,
  adminMode,
  provozovny,
}) {
  const [form, setForm] = useState(
    initialData || {
      ...emptyReport,
      uzivatel_id: currentUserId,
    }
  );

  const [vozy, setVozy] = useState([]);

  useEffect(() => {
    setForm(
      initialData || {
        ...emptyReport,
        uzivatel_id: currentUserId,
      }
    );
  }, [initialData, currentUserId]);

  useEffect(() => {
    async function loadVozy() {
      if (!form.provozovna_id) {
        setVozy([]);
        return;
      }

      const { data, error } = await supabase
        .from("vozy")
        .select(
          "id, cislo, vyrobce, typ, spz"
        )
        .eq(
          "provozovna_id",
          Number(form.provozovna_id)
        )
        .order("cislo", {
          ascending: true,
        });

      if (error) {
        console.error(error);
        setVozy([]);
      } else {
        setVozy(data || []);
      }
    }

    loadVozy();
  }, [form.provozovna_id]);

  function change(name, value) {
    setForm((old) => {
      const next = {
        ...old,
        [name]: value,
      };

      if (name === "provozovna_id") {
        next.vuz = "";
      }

      return next;
    });
  }

  function submit(e) {
    e.preventDefault();

    if (!form.provozovna_id) {
      alert("Vyber provozovnu.");
      return;
    }

    if (!form.vuz) {
      alert("Vyber vůz.");
      return;
    }

    onSave(form);
  }

  return (
    <div className="crud-form">
      <h3>
        {initialData
          ? "✏️ Upravit výkaz"
          : "➕ Přidat výkaz"}
      </h3>

      <form onSubmit={submit}>
        <div className="form-grid">
          {adminMode && (
            <div>
              <label>Řidič</label>

              <select
                value={form.uzivatel_id}
                onChange={(e) =>
                  change(
                    "uzivatel_id",
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Vyber řidiče
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.jmeno || user.id} —{" "}
                    {getRoleName(user.role)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ProvozovnaSelect
            value={form.provozovna_id}
            onChange={(value) =>
              change("provozovna_id", value)
            }
            provozovny={provozovny}
            required
          />

          <div>
            <label>Vůz</label>

            <select
              value={form.vuz || ""}
              onChange={(e) =>
                change("vuz", e.target.value)
              }
              disabled={!form.provozovna_id}
              required
            >
              <option value="">
                {!form.provozovna_id
                  ? "Nejdříve vyber provozovnu"
                  : "Vyber vůz"}
              </option>

              {vozy.map((vehicle) => (
                <option
                  key={vehicle.id}
                  value={String(vehicle.cislo)}
                >
                  {vehicle.cislo} –{" "}
                  {vehicle.vyrobce}{" "}
                  {vehicle.typ}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Datum</label>

            <input
              type="date"
              value={form.datum || ""}
              onChange={(e) =>
                change("datum", e.target.value)
              }
              required
            />
          </div>

          <div>
            <label>Linka</label>

            <input
              value={form.linka || ""}
              onChange={(e) =>
                change("linka", e.target.value)
              }
              placeholder="Např. 12"
              required
            />
          </div>

          <div>
            <label>Směr</label>

            <input
              value={form.smer || ""}
              onChange={(e) =>
                change("smer", e.target.value)
              }
              placeholder="Např. Terminál → Břeclavsko"
              required
            />
          </div>

          <div>
            <label>Začátek</label>

            <input
              type="time"
              value={form.zacatek || ""}
              onChange={(e) =>
                change("zacatek", e.target.value)
              }
              required
            />
          </div>

          <div>
            <label>Konec</label>

            <input
              type="time"
              value={form.konec || ""}
              onChange={(e) =>
                change("konec", e.target.value)
              }
              required
            />
          </div>
        </div>

        <div className="form-buttons">
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Ukládání..." : "✓ Uložit výkaz"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            Zrušit
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   KARTA VÝKAZU
========================================================= */

function ReportCard({
  report,
  userName,
  provozovnaName,
  onEdit,
  onDelete,
}) {
  return (
    <div className="report-card">
      <div className="report-date">
        <strong>
          {report.datum
            ? new Date(
                `${report.datum}T00:00:00`
              ).toLocaleDateString("cs-CZ")
            : "-"}
        </strong>

        {userName && <small>{userName}</small>}
      </div>

      <div>
        <small>Provozovna</small>
        <strong>{provozovnaName || "-"}</strong>
      </div>

      <div>
        <small>Linka</small>
        <strong>{report.linka || "-"}</strong>
      </div>

      <div>
        <small>Vůz</small>
        <strong>{report.vuz || "-"}</strong>
      </div>

      <div>
        <small>Čas</small>
        <strong>
          {report.zacatek || "-"} –{" "}
          {report.konec || "-"}
        </strong>
      </div>

      {(onEdit || onDelete) && (
        <div className="report-actions">
          {onEdit && (
            <button
              className="secondary-button"
              type="button"
              onClick={onEdit}
            >
              ✏️
            </button>
          )}

          {onDelete && (
            <button
              className="delete-button"
              type="button"
              onClick={onDelete}
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MOJE VÝKAZY
========================================================= */

function MyReports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { provozovny } = useProvozovny();

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("vykazy")
      .select(
        "id, uzivatel_id, provozovna_id, datum, linka, smer, vuz, zacatek, konec"
      )
      .eq("uzivatel_id", user.id)
      .order("datum", { ascending: false })
      .order("zacatek", { ascending: false });

    if (error) {
      setError(error.message);
      setReports([]);
    } else {
      setReports(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [user.id]);

  function getProvozovnaName(id) {
    return (
      provozovny.find(
        (p) => Number(p.id) === Number(id)
      )?.nazev || "-"
    );
  }

  async function saveReport(form) {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      uzivatel_id: user.id,
      provozovna_id: Number(form.provozovna_id),
      datum: form.datum,
      linka: form.linka.trim(),
      smer: form.smer.trim(),
      vuz: form.vuz.trim(),
      zacatek: form.zacatek,
      konec: form.konec,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("vykazy")
        .update(payload)
        .eq("id", editing.id)
        .eq("uzivatel_id", user.id);
    } else {
      result = await supabase
        .from("vykazy")
        .insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editing
        ? "Výkaz byl upraven."
        : "Výkaz byl přidán."
    );

    setEditing(null);
    setShowForm(false);

    await loadReports();

    setSaving(false);
  }

  async function deleteReport(report) {
    if (
      !window.confirm(
        "Opravdu chceš tento výkaz smazat?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("vykazy")
      .delete()
      .eq("id", report.id)
      .eq("uzivatel_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Výkaz byl smazán.");

    await loadReports();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Moje výkazy</h1>
          <p>Výkazy přihlášeného uživatele</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="panel">
        <div className="users-toolbar">
          <div>
            <h2>Moje výkazy</h2>

            <p className="muted">
              Při přidání nejdříve vybereš provozovnu a potom
              pouze vůz z této provozovny.
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? "✕ Zavřít" : "➕ Přidat výkaz"}
          </button>
        </div>

        {showForm && (
          <ReportForm
            currentUserId={user.id}
            initialData={editing}
            users={[]}
            adminMode={false}
            onSave={saveReport}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
            provozovny={provozovny}
          />
        )}

        {loading && (
          <div className="empty">
            Načítání výkazů...
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="empty">
            Zatím žádné výkazy.
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="reports-list">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                provozovnaName={getProvozovnaName(
                  report.provozovna_id
                )}
                onEdit={() => {
                  setEditing(report);
                  setShowForm(true);
                }}
                onDelete={() => deleteReport(report)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SPRÁVA VÝKAZŮ
========================================================= */

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedProvozovna, setSelectedProvozovna] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { provozovny } = useProvozovny();

  async function loadData() {
    setLoading(true);
    setError("");

    const [reportsResult, usersResult] =
      await Promise.all([
        supabase
          .from("vykazy")
          .select(
            "id, uzivatel_id, provozovna_id, datum, linka, smer, vuz, zacatek, konec"
          )
          .order("datum", { ascending: false })
          .order("zacatek", { ascending: false }),

        supabase
          .from("profiles")
          .select("id, jmeno, role")
          .order("jmeno", { ascending: true }),
      ]);

    if (reportsResult.error) {
      setError(reportsResult.error.message);
    } else {
      setReports(reportsResult.data || []);
    }

    if (usersResult.error) {
      setError(usersResult.error.message);
    } else {
      setUsers(usersResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getUserName(id) {
    return (
      users.find((u) => u.id === id)?.jmeno ||
      "Neznámý uživatel"
    );
  }

  function getProvozovnaName(id) {
    return (
      provozovny.find(
        (p) => Number(p.id) === Number(id)
      )?.nazev || "-"
    );
  }

  async function saveReport(form) {
    setSaving(true);
    setError("");
    setSuccess("");

    if (!form.uzivatel_id) {
      setError("Vyber řidiče.");
      setSaving(false);
      return;
    }

    if (!form.provozovna_id) {
      setError("Vyber provozovnu.");
      setSaving(false);
      return;
    }

    if (!form.vuz) {
      setError("Vyber vůz.");
      setSaving(false);
      return;
    }

    const payload = {
      uzivatel_id: form.uzivatel_id,
      provozovna_id: Number(form.provozovna_id),
      datum: form.datum,
      linka: form.linka.trim(),
      smer: form.smer.trim(),
      vuz: form.vuz.trim(),
      zacatek: form.zacatek,
      konec: form.konec,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("vykazy")
        .update(payload)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("vykazy")
        .insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editing
        ? "Výkaz byl upraven."
        : "Výkaz byl přidán."
    );

    setShowForm(false);
    setEditing(null);

    await loadData();

    setSaving(false);
  }

  async function deleteReport(report) {
    if (
      !window.confirm(
        "Opravdu chceš tento výkaz smazat?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("vykazy")
      .delete()
      .eq("id", report.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Výkaz byl smazán.");

    await loadData();
  }

  const filtered = reports.filter((report) => {
    if (
      selectedProvozovna &&
      Number(report.provozovna_id) !==
        Number(selectedProvozovna)
    ) {
      return false;
    }

    const text = [
      report.datum,
      report.linka,
      report.smer,
      report.vuz,
      report.zacatek,
      report.konec,
      getUserName(report.uzivatel_id),
      getProvozovnaName(report.provozovna_id),
    ]
      .filter(
        (x) =>
          x !== null &&
          x !== undefined
      )
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Správa výkazů</h1>
          <p>Administrace výkazů řidičů</p>
        </div>

        <div className="profile-badge">
          {filtered.length} VÝKAZŮ
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <div className="panel">
        <div className="provozovna-bar">
          <ProvozovnaSelect
            value={selectedProvozovna}
            onChange={setSelectedProvozovna}
            provozovny={provozovny}
            label="Zobrazit výkazy provozovny"
          />

          <button
            className="secondary-button"
            type="button"
            onClick={() => setSelectedProvozovna("")}
          >
            Všechny provozovny
          </button>
        </div>

        <div className="users-toolbar">
          <div>
            <h2>Výkazy řidičů</h2>

            <p className="muted">
              Přidávání, úprava a mazání výkazů.
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setEditing(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? "✕ Zavřít" : "➕ Přidat výkaz"}
          </button>
        </div>

        {showForm && (
          <ReportForm
            initialData={editing}
            users={users}
            currentUserId=""
            adminMode={true}
            onSave={saveReport}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
            provozovny={provozovny}
          />
        )}

        <input
          className="search"
          type="text"
          placeholder="🔎 Hledat výkaz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && (
          <div className="empty">
            Načítání výkazů...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty">
            Žádné výkazy.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="reports-list">
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                userName={getUserName(
                  report.uzivatel_id
                )}
                provozovnaName={getProvozovnaName(
                  report.provozovna_id
                )}
                onEdit={() => {
                  setEditing(report);
                  setShowForm(true);
                }}
                onDelete={() =>
                  deleteReport(report)
                }
              />
            ))}
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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    vypravy: 0,
    aktivniVozy: 0,
    vozyCelkem: 0,
    provozovny: 0,
  });

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(false);

  const [page, setPage] = useState("dashboard");
  const [showRegister, setShowRegister] =
    useState(false);

  async function loadProfile(authUser) {
    if (!authUser) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, jmeno, role, created_at")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      console.error("PROFILE ERROR:", error);
      setProfile(null);
    } else {
      setProfile(data || null);
    }

    setProfileLoading(false);
  }

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const loggedUser = session?.user || null;

        setUser(loggedUser);

        if (loggedUser) {
          await loadProfile(loggedUser);
        } else {
          setProfile(null);
          setPage("dashboard");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const { data, error } =
      await supabase.auth.getUser();

    if (error) {
      console.error(error);
    }

    const loggedUser = data?.user || null;

    setUser(loggedUser);

    if (loggedUser) {
      await loadProfile(loggedUser);
    }

    setLoading(false);
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
    if (showRegister) {
      return (
        <>
          <style>{styles}</style>

          <Register
            onRegistered={() =>
              setShowRegister(false)
            }
          />
        </>
      );
    }

    return (
      <>
        <style>{styles}</style>

        <Login
          onLogin={async (loggedUser) => {
            setUser(loggedUser);
            await loadProfile(loggedUser);
          }}
        />

        <button
          className="register-link"
          onClick={() =>
            setShowRegister(true)
          }
        >
          Nemáš účet? Zaregistrovat se
        </button>
      </>
    );
  }

  const role = profile?.role?.toLowerCase() || "";
  const roleName = getRoleName(role);

  const manageVehicles = canManageVehicles(role);
  const manageReports = canManageReports(role);
  const manageUsers = canManageUsers(role);
  const useReports = canUseReports(role);

  return (
    <>
      <style>{styles}</style>

      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">CM</div>

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
                  page === "adminVehicles"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("adminVehicles")
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
                {profile?.jmeno || user.email}
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
                  <strong>2</strong>
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
          )}

          {page === "departures" && (
            <div className="panel">
              <h1>Výpravy</h1>
              <p>
                Tady budou výpravy vozů.
              </p>
            </div>
          )}

          {page === "vehicles" && <Vehicles />}

          {page === "reports" &&
            useReports && (
              <MyReports user={user} />
            )}

          {page === "adminVehicles" &&
            manageVehicles && (
              <AdminVehicles />
            )}

          {page === "adminReports" &&
            manageReports && (
              <AdminReports />
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
   STYLES
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
}

.login-error {
  color: #dc2626;
  background: #fee2e2;
  padding: 10px;
  border-radius: 8px;
  margin-top: 15px;
}

.register-link {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 25px;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.register-back {
  width: 100%;
  border: 0;
  background: transparent;
  color: #2563eb;
  margin-top: 15px;
  cursor: pointer;
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

.success-box {
  padding: 15px;
  border-radius: 9px;
  background: #dcfce7;
  color: #15803d;
  margin-bottom: 20px;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #718096;
}

.primary-button,
.secondary-button,
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

.secondary-button {
  background: #eef2f7;
  color: #172033;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
}

.users-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.user-create-box,
.crud-form {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 12px;
}

.user-filter {
  margin: 20px 0;
}

.user-filter select {
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
  margin-bottom: 4px;
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

.provozovna-bar {
  display: flex;
  align-items: end;
  gap: 12px;
  margin-bottom: 20px;
}

.provozovna-bar > div:first-child {
  flex: 1;
}

.provozovna-bar label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 7px;
}

.provozovna-bar select {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  background: white;
}

.search {
  width: 100%;
  padding: 13px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  outline: none;
  margin: 20px 0;
}

.search:focus {
  border-color: #2563eb;
}

.vehicle-header,
.vehicle-row {
  display: grid;
  grid-template-columns:
    80px 140px 1fr 120px 80px 150px;
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

.admin-vehicles-list {
  display: flex;
  flex-direction: column;
}

.admin-vehicle-card {
  display: grid;
  grid-template-columns: 70px 1fr 180px auto;
  gap: 20px;
  align-items: center;
  padding: 18px 5px;
  border-bottom: 1px solid #edf0f5;
}

.vehicle-number {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  background: #eaf0ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
}

.vehicle-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vehicle-main small {
  color: #718096;
}

.vehicle-actions {
  display: flex;
  gap: 7px;
}

.reports-list {
  display: flex;
  flex-direction: column;
}

.report-card {
  display: grid;
  grid-template-columns:
    130px 130px 100px 100px 150px auto;
  gap: 18px;
  align-items: center;
  padding: 18px 5px;
  border-bottom: 1px solid #edf0f5;
}

.report-card > div {
  min-width: 0;
}

.report-card small {
  display: block;
  color: #718096;
  font-size: 11px;
  margin-bottom: 4px;
}

.report-card strong {
  display: block;
  overflow-wrap: anywhere;
}

.report-actions {
  display: flex;
  gap: 7px;
}

@media (max-width: 1200px) {
  .report-card {
    grid-template-columns:
      120px 120px 80px 90px 130px auto;
  }

  .admin-vehicle-card {
    grid-template-columns:
      60px 1fr 160px auto;
  }
}

@media (max-width: 1100px) {
  .stats,
  .admin-user-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-card {
    grid-template-columns:
      auto 1fr 1fr;
  }

  .admin-vehicle-card {
    grid-template-columns:
      60px 1fr;
  }

  .report-card {
    grid-template-columns:
      1fr 1fr;
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

  .user-card {
    grid-template-columns:
      auto 1fr;
  }

  .vehicle-header {
    display: none;
  }

  .vehicle-row {
    grid-template-columns:
      70px 1fr;
  }

  .vehicle-row > * {
    margin-bottom: 5px;
  }

  .provozovna-bar {
    flex-direction: column;
    align-items: stretch;
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
    grid-template-columns:
      auto 1fr;
  }

  .admin-vehicle-card {
    grid-template-columns:
      55px 1fr;
  }

  .vehicle-actions {
    grid-column: 1 / -1;
  }

  .report-card {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .panel {
    padding: 18px;
  }

  .topbar {
    flex-direction: column;
  }

  .profile-badge {
    align-self: flex-start;
  }
}
`;

export default App;
