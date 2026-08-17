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

function canManageNews(role) {
  return role === ROLE_ADMIN || role === ROLE_DISPECER;
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
  "PROVOZNÍ": "#caffca",
  "V DÍLNĚ / V OPRAVĚ": "#ffca97",
  "DOČASNĚ ODSTAVEN": "#eaeaea",
  "DEFINITIVNĚ ODSTAVEN": "#cacaca",
  "DLOUHODOBĚ ODSTAVEN": "#cacaca",
  "SEŠROTOVÁN": "#ffcaca",
  "PRODÁN / PŘEDÁN JINÉMU DOPRAVCI": "#ffcaff",
  "DOSUD NEZAŘAZEN DO PROVOZU": "#cacaff",
  "SLUŽEBNÍ": "#ffffca",
  "RETRO": "#caffff",
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
   DETAIL VOZU
========================================================= */

const vehicleDetailFields = [
  ["vyrobce", "Výrobce"],
  ["typ", "Typ"],
  ["spz", "SPZ"],
  ["rok", "Rok výroby"],
  ["stav", "Stav"],
  ["barevne_schema", "Nátěr"],
  ["reklamy", "Reklamy"],
  ["vybaveni", "Vybavení"],
  ["prevodovka", "Převodovka"],
  ["rozlozeni_dveri", "Rozložení dveří"],
  ["stk", "STK"],
  ["palubni_deska", "Palubní deska"],
  ["informacni_system", "Informační systém"],
  ["ridic_1", "Řidič 1"],
  ["ridic_2", "Řidič 2"],
];

function formatStkForDisplay(value) {
  if (!value) return "";
  const raw = String(value).trim();

  // Supabase/date column usually returns YYYY-MM-DD.
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[2]}/${iso[1]}`;
  }

  // Already in MM/YYYY form.
  const monthYear = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) {
    return `${monthYear[1].padStart(2, "0")}/${monthYear[2]}`;
  }

  return raw;
}

function stkInputToDate(value) {
  if (!value) return null;

  const raw = String(value).trim();

  // Accept MM/YYYY and store it safely in a PostgreSQL date column.
  const monthYear = raw.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (monthYear) {
    return `${monthYear[2]}-${monthYear[1]}-01`;
  }

  // Also accept YYYY-MM-DD if already supplied.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  return raw;
}

function VehicleDetail({ vehicle, role, onBack, onSaved }) {
  const editable = canManageVehicles(role);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...vehicle });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setForm({
      ...vehicle,
      stk: formatStkForDisplay(vehicle.stk),
    });
    setEditing(false);
    setError("");
    setSuccess("");
  }, [vehicle]);

  useEffect(() => {
    supabase.from("vehicle_history")
      .select("id, typ, popis, created_at")
      .eq("vuz_id", vehicle.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setHistory(data || []));
  }, [vehicle.id]);

  function change(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

 async function save() {
  setSaving(true);
  setError("");
  setSuccess("");

  const payload = {};

  vehicleDetailFields.forEach(([field]) => {
    let value = form[field];

    if (field === "rok") {
      value =
        value === "" || value == null
          ? null
          : Number(value);
    } else if (field === "stk") {
      value = stkInputToDate(value);
    } else if (value === "") {
      value = null;
    }

    payload[field] = value;
  });

  const { data, error: saveError } = await supabase
    .from("vozy")
    .update(payload)
    .eq("id", vehicle.id)
    .select("*")
    .single();

  if (saveError) {
    console.error("Chyba při ukládání vozu:", saveError);
    setError(saveError.message);
    setSaving(false);
    return;
  }

  const updatedVehicle = {
    ...data,
    stk: formatStkForDisplay(data?.stk),
  };

  setForm(updatedVehicle);
  setEditing(false);
  setSuccess("Údaje vozu byly uloženy.");
  setSaving(false);

  if (onSaved) {
    onSaved(updatedVehicle);
  }
}

  return (
    <div>
      <div className="topbar">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
            style={{ marginBottom: 12 }}
          >
            ← Zpět na vozy
          </button>

          <h1>Vůz {vehicle.cislo ?? "-"}</h1>

          <p>
            {vehicle.vyrobce || "-"}{" "}
            {vehicle.typ || ""}
          </p>
        </div>

        {editable && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditing((old) => !old);
              }}
              disabled={saving}
            >
              {editing ? "Zrušit úpravy" : "✏️ Upravit vůz"}
            </button>

            {editing && (
              <button
                type="button"
                className="primary-button"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Ukládám..." : "💾 Uložit"}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: 16 }}>
          <strong>Chyba:</strong>
          <br />
          {error}
        </div>
      )}

      {success && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div className="panel">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {vehicleDetailFields.map(([field, label]) => (
            <div
              key={field}
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7280",
                  marginBottom: 7,
                }}
              >
                {label}
              </div>

              {editing && editable ? (
                field === "stav" ? (
                  <select
                    className="form-input"
                    value={form[field] ?? ""}
                    onChange={(e) => change(field, e.target.value)}
                  >
                    <option value="">—</option>
                    {Object.keys(vehicleStatusColors).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      className="form-input"
                      type={field === "rok" ? "number" : "text"}
                      value={form[field] ?? ""}
                      onChange={(e) => change(field, e.target.value)}
                      placeholder={
                        field === "stk"
                          ? "MM/YYYY"
                          : label
                      }
                    />
                    {field === "stk" && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        Zadej například 07/2027
                      </div>
                    )}
                  </>
                )
              ) : (
                <div style={{ fontWeight: 600 }}>
                  {form[field] === null ||
                  form[field] === undefined ||
                  form[field] === ""
                    ? "—"
                    : field === "stk"
                    ? formatStkForDisplay(form[field])
                    : String(form[field])}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="vehicle-extra-panel">
          <h2>Historie vozu</h2>
          {history.length === 0 ? <div className="empty">Zatím bez historie.</div> : (
            <div className="simple-list">{history.map((item) => (
              <div className="simple-list-item" key={item.id}>
                <div><strong>{item.typ}</strong><div>{item.popis}</div></div>
                <small>{item.created_at ? new Date(item.created_at).toLocaleString("cs-CZ") : "-"}</small>
              </div>
            ))}</div>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 10,
            background: "#f8fafc",
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Detail je společný pro všechny vozy. Kliknutím na jiný vůz
          se vždy načtou údaje právě toho konkrétního záznamu z tabulky
          <strong> vozy</strong>.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VEŘEJNÝ SEZNAM VOZŮ
========================================================= */

function Vehicles({ role }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProvozovna, setSelectedProvozovna] =
    useState("");
  const [selectedVehicleId, setSelectedVehicleId] =
    useState(null);

  const { provozovny } = useProvozovny();

  async function loadVehicles() {
    setLoading(true);
    setError("");

    // Načítáme celý záznam vozu, aby detailní údaje
    // (reklamy, vybavení, dveře, STK atd.) zůstaly dostupné i po refreshi.
    const { data, error } = await supabase
      .from("vozy")
      .select("*")
      .order("cislo", { ascending: true });

    if (error) {
      console.error("VOZY ERROR:", error);
      setError(error.message || "Nepodařilo se načíst vozy.");
      setVehicles([]);
    } else {
      setVehicles(Array.isArray(data) ? data : []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === String(selectedVehicleId)
  );

  if (selectedVehicle) {
    return (
      <VehicleDetail
        vehicle={selectedVehicle}
        role={role}
        onBack={() => setSelectedVehicleId(null)}
        onSaved={(updated) => {
          setVehicles((old) =>
            old.map((vehicle) =>
              vehicle.id === updated.id ? updated : vehicle
            )
          );
        }}
      />
    );
  }

  const query = search.trim().toLowerCase();

  const filtered = vehicles.filter((vehicle) => {
    if (
      selectedProvozovna &&
      Number(vehicle.provozovna_id) !== Number(selectedProvozovna)
    ) {
      return false;
    }

    if (!query) return true;

    const text = [
      vehicle.cislo,
      vehicle.vyrobce,
      vehicle.typ,
      vehicle.spz,
      vehicle.rok,
      vehicle.barevne_schema,
      vehicle.stav,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase();

    return text.includes(query);
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

        {!loading && error && (
          <div className="error-box">
            <strong>Chyba při načítání vozů:</strong>
            <br />
            {error}
            <br /><br />
            <button
              type="button"
              className="secondary-button"
              onClick={loadVehicles}
            >
              Zkusit znovu
            </button>
          </div>
        )}

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
                key={vehicle.id}
                className="vehicle-row vehicle-row-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedVehicleId(vehicle.id);
                  }
                }}
                title={`Otevřít detail vozu ${vehicle.cislo ?? "-"}`}
              >
                <strong>{vehicle.cislo ?? "-"}</strong>
                <span>{vehicle.vyrobce ?? "-"}</span>
                <span>{vehicle.typ ?? "-"}</span>
                <span>{vehicle.spz ?? "-"}</span>
                <span>{vehicle.rok ?? "-"}</span>
                <span>
                  <VehicleStatus status={vehicle.stav} />
                </span>
              </div>
            ))}
          </>
        )}

        {!loading && !error && filtered.length === 0 && (
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
   NOVINKY
========================================================= */

function News({ user, profile, role }) {
  const [news, setNews] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  const canManage = canManageNews(role);
  const isDriver = role === ROLE_RIDIC;

  const emptyForm = {
    nadpis: "",
    obsah: "",
    dulezitost: "Běžná",
  };

  const [form, setForm] = useState(emptyForm);

  async function loadNews() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("novinky")
      .select(`
        id,
        nadpis,
        obsah,
        dulezitost,
        autor_id,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("NOVINKY ERROR:", error);
      setError(error.message);
      setNews([]);
      setLoading(false);
      return;
    }

    setNews(data || []);

    const newsIds = (data || []).map((item) => item.id);

    if (newsIds.length > 0) {
      const { data: confirmationData, error: confirmationError } =
        await supabase
          .from("novinky_potvrzeni")
          .select("id, novinka_id, uzivatel_id, potvrzeno_at")
          .in("novinka_id", newsIds);

      if (confirmationError) {
        console.error(
          "NOVINKY POTVRZENI ERROR:",
          confirmationError
        );
      }

      setConfirmations(confirmationData || []);
    } else {
      setConfirmations([]);
    }

    if (canManage) {
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, jmeno, role")
          .order("jmeno", { ascending: true });

      if (profileError) {
        console.error(
          "NOVINKY PROFILES ERROR:",
          profileError
        );
      }

      setProfiles(profileData || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNews();
  }, [canManage]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      nadpis: item.nadpis || "",
      obsah: item.obsah || "",
      dulezitost: item.dulezitost || "Běžná",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveNews(e) {
    e.preventDefault();

    const nadpis = form.nadpis.trim();
    const obsah = form.obsah.trim();

    if (!nadpis || !obsah) {
      setError("Vyplň nadpis a text novinky.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      nadpis,
      obsah,
      dulezitost: form.dulezitost,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("novinky")
        .update(payload)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("novinky")
        .insert({
          ...payload,
          autor_id: user.id,
        });
    }

    if (result.error) {
      console.error("SAVE NOVINKA ERROR:", result.error);
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editing
        ? "Novinka byla upravena."
        : "Novinka byla zveřejněna."
    );

    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);

    await loadNews();
    setSaving(false);
  }

  async function deleteNews(id) {
    if (
      !window.confirm(
        "Opravdu chceš tuto novinku smazat?"
      )
    ) {
      return;
    }

    setError("");

    const { error } = await supabase
      .from("novinky")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE NOVINKA ERROR:", error);
      setError(error.message);
      return;
    }

    if (selectedNews?.id === id) {
      setSelectedNews(null);
    }

    await loadNews();
  }

  async function confirmNews(item) {
    if (!user?.id) return;

    setError("");
    setSuccess("");

    const alreadyConfirmed = confirmations.some(
      (confirmation) =>
        confirmation.novinka_id === item.id &&
        confirmation.uzivatel_id === user.id
    );

    if (alreadyConfirmed) {
      return;
    }

    const { error } = await supabase
      .from("novinky_potvrzeni")
      .insert({
        novinka_id: item.id,
        uzivatel_id: user.id,
      });

    if (error) {
      if (error.code === "23505") {
        await loadNews();
        return;
      }

      console.error(
        "CONFIRM NOVINKA ERROR:",
        error
      );
      setError(error.message);
      return;
    }

    setSuccess("Novinka byla potvrzena jako přečtená.");
    await loadNews();
  }

  function isConfirmed(item) {
    return confirmations.some(
      (confirmation) =>
        confirmation.novinka_id === item.id &&
        confirmation.uzivatel_id === user?.id
    );
  }

  function getAuthorName(authorId) {
    const author = profiles.find(
      (profileItem) => profileItem.id === authorId
    );

    return author?.jmeno || "Uživatel";
  }

  function getConfirmationCount(item) {
    return confirmations.filter(
      (confirmation) =>
        confirmation.novinka_id === item.id
    ).length;
  }

  function getDriverProfiles() {
    return profiles.filter(
      (profileItem) =>
        profileItem.role?.toLowerCase() === ROLE_RIDIC
    );
  }

  function formatDate(value) {
    if (!value) return "";

    return new Date(value).toLocaleString(
      "cs-CZ",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );
  }

  return (
    <div className="news-page">
      <div className="topbar">
        <div>
          <h1>Novinky</h1>
          <p>
            Důležité informace pro řidiče a vedení Czech Mobility
          </p>
        </div>

        {canManage && (
          <button
            className="primary-button"
            onClick={openCreate}
          >
            + Nová novinka
          </button>
        )}
      </div>

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

      {showForm && canManage && (
        <div className="panel news-form-panel">
          <div className="panel-header">
            <div>
              <h2>
                {editing
                  ? "Upravit novinku"
                  : "Vytvořit novinku"}
              </h2>
              <p>
                Novinka se po zveřejnění zobrazí všem
                přihlášeným uživatelům.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Zavřít
            </button>
          </div>

          <form
            className="news-form"
            onSubmit={saveNews}
          >
            <div className="form-group">
              <label>Nadpis</label>
              <input
                name="nadpis"
                value={form.nadpis}
                onChange={handleChange}
                placeholder="Např. Změna pravidel výprav"
                maxLength={160}
              />
            </div>

            <div className="form-group">
              <label>Důležitost</label>
              <select
                name="dulezitost"
                value={form.dulezitost}
                onChange={handleChange}
              >
                <option value="Běžná">Běžná</option>
                <option value="Důležitá">Důležitá</option>
                <option value="Urgentní">Urgentní</option>
              </select>
            </div>

            <div className="form-group">
              <label>Text novinky</label>
              <textarea
                name="obsah"
                value={form.obsah}
                onChange={handleChange}
                placeholder="Napiš text novinky..."
                rows={8}
              />
            </div>

            <div className="news-form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Ukládání..."
                  : editing
                    ? "Uložit změny"
                    : "Zveřejnit novinku"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="panel">
          <div className="loading-inline">
            Načítání novinek...
          </div>
        </div>
      ) : news.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-icon">📰</div>
          <h2>Zatím nejsou žádné novinky</h2>
          <p>
            Jakmile bude zveřejněna první novinka,
            zobrazí se zde.
          </p>
        </div>
      ) : (
        <div className="news-list">
          {news.map((item) => {
            const confirmed =
              isDriver && isConfirmed(item);
            const confirmationCount =
              getConfirmationCount(item);
            const driverCount =
              getDriverProfiles().length;

            return (
              <article
                className={
                  `news-card ${
                    confirmed
                      ? "news-card-confirmed"
                      : ""
                  }`
                }
                key={item.id}
              >
                <div className="news-card-top">
                  <div>
                    <span
                      className={
                        `news-priority ${
                          item.dulezitost === "Urgentní"
                            ? "urgent"
                            : item.dulezitost === "Důležitá"
                              ? "important"
                              : ""
                        }`
                      }
                    >
                      {item.dulezitost || "Běžná"}
                    </span>

                    <h2>{item.nadpis}</h2>

                    <div className="news-meta">
                      {formatDate(item.created_at)}
                      {canManage &&
                        item.autor_id && (
                          <>
                            {" • "}
                            Autor:{" "}
                            {getAuthorName(
                              item.autor_id
                            )}
                          </>
                        )}
                    </div>
                  </div>

                  <div
                    className={
                      confirmed
                        ? "news-status confirmed"
                        : isDriver
                          ? "news-status pending"
                          : "news-status confirmed"
                    }
                  >
                    {isDriver
                      ? confirmed
                        ? "✓ Přečteno"
                        : "● Nepotvrzeno"
                      : "ℹ Pro řidiče"}
                  </div>
                </div>

                <div className="news-content">
                  {item.obsah}
                </div>

                <div className="news-card-actions">
                  {isDriver && !confirmed && (
                    <button
                      className="primary-button"
                      onClick={() =>
                        confirmNews(item)
                      }
                    >
                      ✓ Potvrdit přečtení
                    </button>
                  )}

                  {isDriver && confirmed && (
                    <span className="confirmed-text">
                      ✓ Tuto novinku jsi potvrdil
                    </span>
                  )}

                  {canManage && (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setSelectedNews(
                            selectedNews?.id === item.id
                              ? null
                              : item
                          )
                        }
                      >
                        {selectedNews?.id === item.id
                          ? "Skrýt potvrzení"
                          : `Potvrzení ${confirmationCount}/${driverCount}`}
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          openEdit(item)
                        }
                      >
                        ✎ Upravit
                      </button>

                      <button
                        className="secondary-button danger-button"
                        onClick={() =>
                          deleteNews(item.id)
                        }
                      >
                        🗑 Smazat
                      </button>
                    </>
                  )}
                </div>

                {canManage &&
                  selectedNews?.id === item.id && (
                    <div className="news-confirmation-panel">
                      <h3>Potvrzení přečtení</h3>

                      {getDriverProfiles().length ===
                      0 ? (
                        <p>
                          Zatím není evidován žádný řidič.
                        </p>
                      ) : (
                        <div className="news-driver-list">
                          {getDriverProfiles().map(
                            (driver) => {
                              const confirmedByDriver =
                                confirmations.some(
                                  (confirmation) =>
                                    confirmation.novinka_id ===
                                      item.id &&
                                    confirmation.uzivatel_id ===
                                      driver.id
                                );

                              return (
                                <div
                                  className="news-driver-row"
                                  key={driver.id}
                                >
                                  <span>
                                    {driver.jmeno ||
                                      "Bez jména"}
                                  </span>

                                  <strong
                                    className={
                                      confirmedByDriver
                                        ? "driver-confirmed"
                                        : "driver-not-confirmed"
                                    }
                                  >
                                    {confirmedByDriver
                                      ? "✓ Potvrzeno"
                                      : "✕ Nepotvrzeno"}
                                  </strong>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   ŽÁDOST O PŘIDĚLENÍ VOZIDLA
========================================================= */

function VehicleRequest({ user, profile }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadVehicles() {
    const { data, error: vehiclesError } = await supabase
      .from("vozy")
      .select("id, cislo, vyrobce, typ, spz, rok, stav")
      .order("cislo", { ascending: true });

    if (vehiclesError) {
      setError(`Vozy se nepodařilo načíst: ${vehiclesError.message}`);
      setVehicles([]);
      return;
    }

    setVehicles(data || []);
  }

  async function loadMyRequests() {
    if (!user?.id) {
      setRequests([]);
      return;
    }

    const { data, error: requestsError } = await supabase
      .from("zadosti_vozidla")
      .select("id, vuz_id, poznamka, stav, created_at")
      .eq("uzivatel_id", user.id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      setError(`Žádosti se nepodařilo načíst: ${requestsError.message}`);
      setRequests([]);
      return;
    }

    setRequests(data || []);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      await Promise.all([loadVehicles(), loadMyRequests()]);
      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function submitRequest(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("Nejsi přihlášený uživatel.");
      return;
    }

    if (!selectedVehicleId) {
      setError("Vyber vozidlo.");
      return;
    }

    if (!note.trim()) {
      setError("Napiš důvod nebo poznámku k žádosti.");
      return;
    }

    const duplicate = requests.find((r) =>
      Number(r.vuz_id) === Number(selectedVehicleId) &&
      ["ČEKÁ NA VYŘÍZENÍ", "SCHVÁLENO"].includes(r.stav)
    );
    if (duplicate) {
      setError("Na tento vůz už máš aktivní žádost nebo je ti už přidělen.");
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from("zadosti_vozidla")
      .insert({
        uzivatel_id: user.id,
        vuz_id: Number(selectedVehicleId),
        poznamka: note.trim(),
        stav: "ČEKÁ NA VYŘÍZENÍ",
      });

    setSaving(false);

    if (insertError) {
      setError(`Žádost se nepodařilo uložit: ${insertError.message}`);
      return;
    }

    setSelectedVehicleId("");
    setNote("");
    setSuccess("Žádost byla úspěšně odeslána.");
    await loadMyRequests();
  }

  function getVehicle(id) {
    return vehicles.find((vehicle) => Number(vehicle.id) === Number(id));
  }

  const selectedVehicle = selectedVehicleId
    ? getVehicle(selectedVehicleId)
    : null;

  return (
    <div className="request-page">
      <div className="request-hero">
        <div>
          <div className="request-eyebrow">VOZOVÝ PARK</div>
          <h1>Žádost o přidělení vozidla</h1>
          <p>
            Vyber konkrétní vůz a stručně napiš, k čemu ho potřebuješ.
          </p>
        </div>

        <div className="request-user">
          <span className="request-user-dot" />
          <div>
            <strong>{profile?.jmeno || user?.email || "Uživatel"}</strong>
            <small>Nová žádost o přidělení</small>
          </div>
        </div>
      </div>

      {error && (
        <div className="request-alert request-alert-error">
          <span className="request-alert-icon">!</span>
          <div>
            <strong>Žádost se nepodařilo dokončit</strong>
            <div>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="request-alert request-alert-success">
          <span className="request-alert-icon">✓</span>
          <div>
            <strong>Hotovo</strong>
            <div>{success}</div>
          </div>
        </div>
      )}

      <div className="request-layout">
        <section className="request-card request-card-main">
          <div className="request-card-heading">
            <div>
              <span className="request-step">1</span>
              <div>
                <h2>Vyber vozidlo</h2>
                <p>Vyber vůz ze seznamu aktuálně evidovaného vozového parku.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="request-loading">
              <div className="request-spinner" />
              <span>Načítám vozidla…</span>
            </div>
          ) : (
            <form onSubmit={submitRequest}>
              <div className="request-field">
                <label htmlFor="vehicle-request-select">Vozidlo</label>
                <div className="request-select-wrap">
                  <select
                    id="vehicle-request-select"
                    className="request-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    required
                  >
                    <option value="">Vyber vůz…</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.cislo} — {vehicle.vyrobce || "Neznámý výrobce"}{" "}
                        {vehicle.typ || ""}
                        {vehicle.spz ? ` · ${vehicle.spz}` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="request-select-arrow">⌄</span>
                </div>
              </div>

              {selectedVehicle && (
                <div className="request-vehicle-preview">
                  <div className="request-vehicle-icon">🚌</div>
                  <div className="request-vehicle-info">
                    <div className="request-vehicle-number">
                      Vůz {selectedVehicle.cislo}
                    </div>
                    <div className="request-vehicle-name">
                      {selectedVehicle.vyrobce || "—"}{" "}
                      {selectedVehicle.typ || "—"}
                    </div>
                    <div className="request-vehicle-meta">
                      {selectedVehicle.rok
                        ? `Rok ${selectedVehicle.rok}`
                        : "Rok neuveden"}
                      {selectedVehicle.spz
                        ? ` · SPZ ${selectedVehicle.spz}`
                        : ""}
                    </div>
                  </div>
                  <div className="request-vehicle-status">
                    <span>{selectedVehicle.stav || "—"}</span>
                  </div>
                </div>
              )}

              <div className="request-card-heading request-card-heading-spaced">
                <div>
                  <span className="request-step">2</span>
                  <div>
                    <h2>Dodatek</h2>
                    <p>
                      Napiš dodatek k přidělení vozidla
                    </p>
                  </div>
                </div>
              </div>

              <div className="request-field">
                <label htmlFor="vehicle-request-note">Dodatek</label>
                <textarea
                  id="vehicle-request-note"
                  className="request-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Napiš dodatek k přidělení vozidla"
                  rows={7}
                  required
                />
                <div className="request-helper">např. šel by tuning?</div>
                <div className="request-hint">
                  Čím konkrétněji žádost popíšeš, tím snadněji ji dispečer vyřídí.
                </div>
              </div>

              <div className="request-submit-row">
                <button
                  className="request-submit-button"
                  type="submit"
                  disabled={saving || loading}
                >
                  <span>{saving ? "Odesílám…" : "Odeslat žádost"}</span>
                  {!saving && <span className="request-submit-arrow">→</span>}
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="request-card request-card-side">
          <div className="request-card-heading">
            <div>
              <div>
                <h2>Moje žádosti</h2>
                <p>Stav dříve odeslaných žádostí.</p>
              </div>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="request-empty-state">
              <div className="request-empty-icon">📋</div>
              <strong>Zatím žádná žádost</strong>
              <span>Odeslané žádosti se zobrazí zde.</span>
            </div>
          ) : (
            <div className="request-history">
              {requests.map((request) => {
                const vehicle = getVehicle(request.vuz_id);

                return (
                  <article className="request-history-item" key={request.id}>
                    <div className="request-history-top">
                      <div>
                        <strong>
                          Vůz {vehicle?.cislo ?? request.vuz_id}
                        </strong>
                        <small>
                          {request.created_at
                            ? new Date(request.created_at).toLocaleString("cs-CZ")
                            : "—"}
                        </small>
                      </div>

                      <span className="request-history-status">
                        {request.stav || "ČEKÁ NA VYŘÍZENÍ"}
                      </span>
                    </div>

                    <div className="request-history-note">
                      {request.poznamka || "Bez poznámky"}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}


/* =========================================================
   SPRÁVA ŽÁDOSTÍ O PŘIDĚLENÍ VOZIDLA
========================================================= */

function AdminVehicleRequests() {
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    const { data, error: requestsError } = await supabase
      .from("zadosti_vozidla")
      .select("id, uzivatel_id, vuz_id, poznamka, stav, created_at")
      .order("created_at", { ascending: false });

    if (requestsError) {
      setError(requestsError.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    const rows = data || [];
    setRequests(rows);

    const userIds = [...new Set(rows.map((r) => r.uzivatel_id).filter(Boolean))];
    const vehicleIds = [...new Set(rows.map((r) => r.vuz_id).filter(Boolean))];

    const [{ data: userRows }, { data: vehicleRows }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, jmeno").in("id", userIds)
        : Promise.resolve({ data: [] }),
      vehicleIds.length
        ? supabase.from("vozy").select("id, cislo, vyrobce, typ, spz").in("id", vehicleIds)
        : Promise.resolve({ data: [] }),
    ]);

    setProfiles(
      Object.fromEntries((userRows || []).map((u) => [u.id, u]))
    );
    setVehicles(
      Object.fromEntries((vehicleRows || []).map((v) => [v.id, v]))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function changeStatus(id, stav) {
    setSavingId(id);
    setError("");
    setSuccess("");

    const request = requests.find((item) => item.id === id);

    if (!request) {
      setError("Žádost se nepodařilo najít.");
      setSavingId(null);
      return;
    }

    // Při schválení žádosti automaticky přidělíme žadatele k vozu.
    // Pokud už je Řidič 1 obsazený, použije se Řidič 2.
    const applicant = profiles[request.uzivatel_id];
    const driverName = applicant?.jmeno?.trim();

    // Při schválení žádosti automaticky přidělíme žadatele k vozu.
    if (stav === "SCHVÁLENO") {
      if (!driverName) {
        setError("U žadatele není vyplněné jméno, proto ho nelze přidělit k vozu.");
        setSavingId(null);
        return;
      }

      const { data: vehicleRow, error: vehicleLoadError } = await supabase
        .from("vozy")
        .select("id, cislo, ridic_1, ridic_2, ridic_1_pridelen_at, ridic_2_pridelen_at")
        .eq("id", request.vuz_id)
        .single();

      if (vehicleLoadError || !vehicleRow) {
        setError(
          vehicleLoadError?.message || "Vůz se nepodařilo načíst."
        );
        setSavingId(null);
        return;
      }

      const driver1 = (vehicleRow.ridic_1 || "").trim();
      const driver2 = (vehicleRow.ridic_2 || "").trim();
      const alreadyAssigned =
        driver1.toLowerCase() === driverName.toLowerCase() ||
        driver2.toLowerCase() === driverName.toLowerCase();

      if (!alreadyAssigned) {
        let vehiclePayload = null;

        if (!driver1) {
          vehiclePayload = { ridic_1: driverName, ridic_1_pridelen_at: new Date().toISOString() };
        } else if (!driver2) {
          vehiclePayload = { ridic_2: driverName, ridic_2_pridelen_at: new Date().toISOString() };
        } else {
          setError(
            `Vůz ${vehicleRow.cislo ?? ""} už má přidělené dva řidiče (${driver1} a ${driver2}).`
          );
          setSavingId(null);
          return;
        }

        const { error: vehicleUpdateError } = await supabase
          .from("vozy")
          .update(vehiclePayload)
          .eq("id", request.vuz_id);

        if (vehicleUpdateError) {
          setError(vehicleUpdateError.message);
          setSavingId(null);
          return;
        }
      }
    }

    // Když byla žádost schválená a následně ji změníme na jiný stav
    // (např. ZAMÍTNUTO), odebereme tohoto žadatele z vozu.
    if (
      request.stav === "SCHVÁLENO" &&
      stav !== "SCHVÁLENO" &&
      driverName
    ) {
      const { data: vehicleRow, error: vehicleLoadError } = await supabase
        .from("vozy")
        .select("id, cislo, ridic_1, ridic_2, ridic_1_pridelen_at, ridic_2_pridelen_at")
        .eq("id", request.vuz_id)
        .single();

      if (vehicleLoadError || !vehicleRow) {
        setError(
          vehicleLoadError?.message || "Vůz se nepodařilo načíst."
        );
        setSavingId(null);
        return;
      }

      const driver1 = (vehicleRow.ridic_1 || "").trim();
      const driver2 = (vehicleRow.ridic_2 || "").trim();
      const normalizedName = driverName.toLowerCase();
      let vehiclePayload = null;

      if (driver1.toLowerCase() === normalizedName) {
        // Pokud byl žadatel Řidič 1, posuneme případného Řidiče 2 nahoru.
        vehiclePayload = {
          ridic_1: driver2 || null,
          ridic_1_pridelen_at: driver2 ? vehicleRow.ridic_2_pridelen_at : null,
          ridic_2: null,
          ridic_2_pridelen_at: null,
        };
      } else if (driver2.toLowerCase() === normalizedName) {
        vehiclePayload = { ridic_2: null, ridic_2_pridelen_at: null };
      }

      if (vehiclePayload) {
        const { error: vehicleUpdateError } = await supabase
          .from("vozy")
          .update(vehiclePayload)
          .eq("id", request.vuz_id);

        if (vehicleUpdateError) {
          setError(vehicleUpdateError.message);
          setSavingId(null);
          return;
        }
      }
    }

    const { error: updateError } = await supabase
      .from("zadosti_vozidla")
      .update({ stav })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    await Promise.all([
      supabase.from("notifications").insert({
        uzivatel_id: request.uzivatel_id,
        typ: "PRIDELENI_VOZU",
        zprava: `Žádost o vůz ${vehicles[request.vuz_id]?.cislo ?? request.vuz_id} byla změněna na ${stav}.`,
      }),
      supabase.from("vehicle_history").insert({
        vuz_id: request.vuz_id,
        uzivatel_id: request.uzivatel_id,
        typ: stav === "SCHVÁLENO" ? "RIDIC_PRIDELEN" : "ZMENA_ZADOSTI",
        popis: `${driverName || "Řidič"}: stav žádosti ${stav}.`,
      }),
      supabase.from("audit_log").insert({
        uzivatel_id: null,
        akce: "ZMENA_STAVU_ZADOSTI",
        entita: "zadosti_vozidla",
        entita_id: String(id),
        detail: `${driverName || request.uzivatel_id} → ${stav}`,
      }),
    ]);

    setSuccess(
      stav === "SCHVÁLENO"
        ? "Žádost byla schválena a řidič byl přidělen k vozu."
        : request.stav === "SCHVÁLENO"
        ? "Žádost byla změněna a řidič byl z vozu odebrán."
        : "Stav žádosti byl změněn."
    );

    await loadRequests();
    setSavingId(null);
  }


  async function deleteRequest(request) {
    setError("");
    setSuccess("");
    setSavingId(request.id);

    const vehicle = vehicles[request.vuz_id];
    const applicant = profiles[request.uzivatel_id];

    const confirmed = window.confirm(
      `Opravdu chceš smazat žádost ${applicant?.jmeno || ""} o vůz ${
        vehicle?.cislo ?? request.vuz_id
      }?`
    );

    if (!confirmed) {
      setSavingId(null);
      return;
    }

    const { data: deletedRows, error: deleteError } = await supabase
      .from("zadosti_vozidla")
      .delete()
      .eq("id", request.id)
      .select("id");

    if (deleteError) {
      console.error("Chyba při mazání žádosti:", deleteError);
      setError(`Žádost se nepodařilo smazat: ${deleteError.message}`);
      setSavingId(null);
      return;
    }

    if (!deletedRows || deletedRows.length === 0) {
      setError(
        "Žádost nebyla smazána. Supabase nevrátil smazaný řádek. Zkontroluj DELETE RLS policy pro zadosti_vozidla."
      );
      setSavingId(null);
      return;
    }

    // Okamžitě ji odebereme i z UI.
    setRequests((old) =>
      old.filter((item) => String(item.id) !== String(request.id))
    );

    // Audit nesmí zablokovat samotné smazání žádosti.
    const { error: auditError } = await supabase.from("audit_log").insert({
      uzivatel_id: null,
      akce: "SMAZANA_ZADOST_O_PRIDELENI",
      entita: "zadosti_vozidla",
      entita_id: String(request.id),
      detail: `${applicant?.jmeno || request.uzivatel_id} · vůz ${
        vehicle?.cislo ?? request.vuz_id
      }`,
    });

    if (auditError) {
      console.warn("Audit log se nepodařilo zapsat:", auditError);
    }

    setSuccess("Žádost byla úspěšně smazána.");
    setSavingId(null);

    // Synchronizace s databází.
    await loadRequests();
  }

  function getRequestStatusClass(stav) {
    if (stav === "SCHVÁLENO") return "approved";
    if (stav === "ZAMÍTNUTO") return "rejected";
    if (stav === "VYŘÍZENO") return "done";
    return "pending";
  }

  return (
    <div className="assignment-admin-page">
      <div className="topbar">
        <div>
          <div className="assignment-admin-eyebrow">VOZOVÝ PARK</div>
          <h1>Žádosti o přidělení vozidla</h1>
          <p>Schvalování, zamítání a správa žádostí o konkrétní vozy.</p>
        </div>

        <div className="profile-badge">
          {requests.length} ŽÁDOSTÍ
        </div>
      </div>

      {error && (
        <div className="request-alert request-alert-error">
          <span className="request-alert-icon">!</span>
          <div>
            <strong>Chyba</strong>
            <div>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="request-alert request-alert-success">
          <span className="request-alert-icon">✓</span>
          <div>
            <strong>Hotovo</strong>
            <div>{success}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="assignment-admin-empty">
          <div className="request-spinner" />
          <span>Načítám žádosti…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="assignment-admin-empty">
          <div className="assignment-admin-empty-icon">📋</div>
          <strong>Žádné žádosti</strong>
          <span>Aktuálně není co vyřizovat.</span>
        </div>
      ) : (
        <div className="assignment-admin-list">
          {requests.map((request) => {
            const applicant = profiles[request.uzivatel_id];
            const vehicle = vehicles[request.vuz_id];
            const busy = savingId === request.id;

            return (
              <article className="assignment-admin-card" key={request.id}>
                <div className="assignment-admin-card-head">
                  <div className="assignment-admin-vehicle">
                    <div className="assignment-admin-bus-icon">🚌</div>

                    <div className="assignment-admin-title">
                      <span>ŽÁDOST O PŘIDĚLENÍ</span>
                      <h3>Vůz {vehicle?.cislo ?? request.vuz_id ?? "-"}</h3>
                      <p>
                        {vehicle
                          ? `${vehicle.vyrobce || "—"} ${vehicle.typ || ""}`.trim()
                          : "Vozidlo se nepodařilo načíst"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`assignment-status-badge ${getRequestStatusClass(
                      request.stav
                    )}`}
                  >
                    {request.stav || "ČEKÁ NA VYŘÍZENÍ"}
                  </span>
                </div>

                <div className="assignment-admin-info-grid">
                  <div className="assignment-admin-info">
                    <span>👤 Žadatel</span>
                    <strong>
                      {applicant?.jmeno || request.uzivatel_id || "-"}
                    </strong>
                  </div>

                  <div className="assignment-admin-info">
                    <span>🪪 SPZ</span>
                    <strong>{vehicle?.spz || "—"}</strong>
                  </div>

                  <div className="assignment-admin-info">
                    <span>📅 Odesláno</span>
                    <strong>
                      {request.created_at
                        ? new Date(request.created_at).toLocaleString("cs-CZ")
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="assignment-admin-note">
                  <span>Poznámka žadatele</span>
                  <p>{request.poznamka || "Bez poznámky"}</p>
                </div>

                <div className="assignment-admin-actions">
                  <div className="assignment-admin-status-control">
                    <label>Stav žádosti</label>
                    <select
                      className="assignment-status-select"
                      value={request.stav || "ČEKÁ NA VYŘÍZENÍ"}
                      onChange={(e) =>
                        changeStatus(request.id, e.target.value)
                      }
                      disabled={busy}
                    >
                      <option value="ČEKÁ NA VYŘÍZENÍ">
                        ČEKÁ NA VYŘÍZENÍ
                      </option>
                      <option value="SCHVÁLENO">SCHVÁLENO</option>
                      <option value="ZAMÍTNUTO">ZAMÍTNUTO</option>
                      <option value="VYŘÍZENO">VYŘÍZENO</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="assignment-delete-button"
                    disabled={busy}
                    onClick={() => deleteRequest(request)}
                  >
                    <span>🗑️</span>
                    {busy ? "Pracuji…" : "Smazat žádost"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}



/* =========================================================
   ČLENOVÉ
========================================================= */

function getMinutesBetweenTimes(start, end) {
  if (!start || !end) return 0;

  const startMatch = String(start).match(/^(\d{1,2}):(\d{2})/);
  const endMatch = String(end).match(/^(\d{1,2}):(\d{2})/);

  if (!startMatch || !endMatch) return 0;

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);

  if (endMinutes >= startMinutes) {
    return endMinutes - startMinutes;
  }

  // Směna přes půlnoc, např. 22:00–02:00.
  return 24 * 60 - startMinutes + endMinutes;
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

function Members({ user }) {
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  async function loadMembers() {
    setLoading(true);
    setError("");

    const [membersResult, reportsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, jmeno, role, created_at")
        .order("jmeno", { ascending: true }),
      supabase
        .from("vykazy")
        .select(
          "id, uzivatel_id, datum, linka, smer, vuz, zacatek, konec, provozovna_id"
        )
        .order("datum", { ascending: false })
        .order("zacatek", { ascending: false }),
    ]);

    if (membersResult.error) {
      setError(membersResult.error.message);
      setMembers([]);
    } else {
      setMembers(membersResult.data || []);
    }

    if (reportsResult.error) {
      setError((old) => old || reportsResult.error.message);
      setReports([]);
    } else {
      setReports(reportsResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const statsByMember = members.reduce((acc, member) => {
    const memberReports = reports.filter(
      (report) => String(report.uzivatel_id) === String(member.id)
    );

    const totalMinutes = memberReports.reduce(
      (sum, report) =>
        sum + getMinutesBetweenTimes(report.zacatek, report.konec),
      0
    );

    acc[member.id] = {
      reports: memberReports,
      totalMinutes,
    };

    return acc;
  }, {});

  const selectedMember = members.find(
    (member) => String(member.id) === String(selectedMemberId)
  );

  const selectedStats = selectedMember
    ? statsByMember[selectedMember.id] || { reports: [], totalMinutes: 0 }
    : null;

  if (selectedMember) {
    return (
      <div>
        <div className="topbar">
          <div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedMemberId(null)}
              style={{ marginBottom: 12 }}
            >
              ← Zpět na členy
            </button>
            <h1>{selectedMember.jmeno || "Bez jména"}</h1>
            <p>{getRoleName(selectedMember.role)}</p>
          </div>

          <div className="profile-badge">
            {formatDuration(selectedStats.totalMinutes)}
          </div>
        </div>

        {error && (
          <div className="error-box" style={{ marginBottom: 16 }}>
            <strong>Chyba:</strong>
            <br />
            {error}
          </div>
        )}

        <div className="member-detail-stats">
          <div className="member-stat-card">
            <span>Celkem hodin</span>
            <strong>{formatDuration(selectedStats.totalMinutes)}</strong>
          </div>
          <div className="member-stat-card">
            <span>Počet výkazů</span>
            <strong>{selectedStats.reports.length}</strong>
          </div>
        </div>

        <div className="panel">
          <div className="users-toolbar">
            <div>
              <h2>Historie směn</h2>
              <p className="muted">
                Všechny výkazy tohoto člena. Celkové hodiny se počítají přímo
                ze začátku a konce jednotlivých směn.
              </p>
            </div>
          </div>

          {selectedStats.reports.length === 0 ? (
            <div className="empty">Tento člen zatím nemá žádný výkaz.</div>
          ) : (
            <div className="member-reports-list">
              {selectedStats.reports.map((report) => {
                const duration = getMinutesBetweenTimes(
                  report.zacatek,
                  report.konec
                );

                return (
                  <div className="member-report-card" key={report.id}>
                    <div className="member-report-date">
                      <strong>
                        {report.datum
                          ? new Date(
                              `${report.datum}T00:00:00`
                            ).toLocaleDateString("cs-CZ")
                          : "-"}
                      </strong>
                      <small>
                        {report.zacatek || "-"} – {report.konec || "-"}
                      </small>
                    </div>

                    <div>
                      <small>Vůz</small>
                      <strong>{report.vuz || "-"}</strong>
                    </div>

                    <div>
                      <small>Linka</small>
                      <strong>{report.linka || "-"}</strong>
                    </div>

                    <div className="member-report-route">
                      <small>Směr</small>
                      <strong>{report.smer || "-"}</strong>
                    </div>

                    <div>
                      <small>Délka</small>
                      <strong>{formatDuration(duration)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalMemberHours = Object.values(statsByMember).reduce(
    (sum, stats) => sum + stats.totalMinutes,
    0
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Členové</h1>
          <p>Přehled členů a jejich odjetých směn</p>
        </div>

        <div className="profile-badge">
          {members.length} ČLENŮ
        </div>
      </div>

      {error && (
        <div className="error-box">
          <strong>Chyba:</strong>
          <br />
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="member-summary-bar">
          <div>
            <span>Členové</span>
            <strong>{members.length}</strong>
          </div>
          <div>
            <span>Celkem hodin</span>
            <strong>{formatDuration(totalMemberHours)}</strong>
          </div>
          <div>
            <span>Celkem výkazů</span>
            <strong>{reports.length}</strong>
          </div>
        </div>
      )}

      <div className="panel">
        {loading ? (
          <div className="empty">Načítání členů...</div>
        ) : members.length === 0 ? (
          <div className="empty">Žádní členové.</div>
        ) : (
          <div className="member-grid">
            {members.map((member) => {
              const stats = statsByMember[member.id] || {
                reports: [],
                totalMinutes: 0,
              };

              return (
                <button
                  type="button"
                  className="member-card"
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div className="member-card-avatar">
                    {(member.jmeno || "Č")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="member-card-main">
                    <strong>{member.jmeno || "Bez jména"}</strong>
                    <small>{getRoleName(member.role)}</small>
                  </div>

                  <div className="member-card-stat">
                    <span>Celkem hodin</span>
                    <strong>{formatDuration(stats.totalMinutes)}</strong>
                  </div>

                  <div className="member-card-stat">
                    <span>Výkazy</span>
                    <strong>{stats.reports.length}</strong>
                  </div>

                  <div className="member-card-arrow">›</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */


/* =========================================================
   NOVÉ MODULY: NOTIFIKACE, ODEVZDÁNÍ, ZÁVADY, VÝPRAVY, AUDIT
========================================================= */
function Notifications({ user, role }) {
  const manage = canManageVehicles(role);

  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const [recipientId, setRecipientId] = useState("");
  const [notificationType, setNotificationType] = useState("OBECNÁ");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  async function load() {
    setError("");

    const { data, error: loadError } = await supabase
      .from("notifications")
      .select("*")
      .eq("uzivatel_id", user.id)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setItems([]);
      return;
    }

    setItems(data || []);
  }

  async function loadProfiles() {
    if (!manage) {
      setProfiles([]);
      return;
    }

    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select("id, jmeno, role")
      .order("jmeno", { ascending: true });

    if (profilesError) {
      setError(profilesError.message);
      setProfiles([]);
      return;
    }

    setProfiles(data || []);
  }

  useEffect(() => {
    load();
  }, [user.id]);

  useEffect(() => {
    loadProfiles();
  }, [manage]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function markAll() {
    setError("");

    const { error: markError } = await supabase
      .from("notifications")
      .update({ precteno: true })
      .eq("uzivatel_id", user.id)
      .eq("precteno", false);

    if (markError) {
      setError(markError.message);
      return;
    }

    await load();
  }

  function chooseImage(event) {
    setError("");

    const file = event.target.files?.[0] || null;

    if (!file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setError("Fotka musí být JPG, PNG nebo WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setError("Fotka může mít maximálně 5 MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  }

  async function uploadNotificationImage() {
    if (!imageFile) {
      return { publicUrl: null, path: null };
    }

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "jpg";

    const path = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("notification-images")
      .upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(`Nahrání fotky selhalo: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("notification-images")
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Nepodařilo se získat veřejnou URL nahrané fotky.");
    }

    return {
      publicUrl: data.publicUrl,
      path,
    };
  }

  async function sendNotification(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!manage) {
      setError("K odesílání notifikací nemáš oprávnění.");
      return;
    }

    if (!recipientId) {
      setError("Vyber příjemce.");
      return;
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setError("Napiš zprávu notifikace.");
      return;
    }

    setSending(true);

    let uploadedPath = null;

    try {
      const { publicUrl, path } = await uploadNotificationImage();
      uploadedPath = path;

      const recipients =
        recipientId === "__all__"
          ? profiles.map((profile) => profile.id)
          : [recipientId];

      if (recipients.length === 0) {
        throw new Error("Nebyl nalezen žádný příjemce.");
      }

      const payload = recipients.map((id) => ({
        uzivatel_id: id,
        typ: notificationType.trim() || "OBECNÁ",
        zprava: cleanMessage,
        image_url: publicUrl,
        precteno: false,
      }));

      const { error: insertError } = await supabase
        .from("notifications")
        .insert(payload);

      if (insertError) {
        if (uploadedPath) {
          await supabase.storage
            .from("notification-images")
            .remove([uploadedPath]);
        }

        throw new Error(`Odeslání notifikace selhalo: ${insertError.message}`);
      }

      setSuccess(
        recipientId === "__all__"
          ? `Notifikace byla odeslána ${recipients.length} uživatelům.`
          : "Notifikace byla odeslána."
      );

      setRecipientId("");
      setNotificationType("OBECNÁ");
      setMessage("");
      removeSelectedImage();

      await load();
    } catch (sendError) {
      setError(sendError?.message || "Notifikaci se nepodařilo odeslat.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="notifications-page">
      <div className="topbar">
        <div>
          <div className="notifications-eyebrow">CENTRUM OZNÁMENÍ</div>
          <h1>Notifikace</h1>
          <p>Změny žádostí a důležité události.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={markAll}
        >
          ✓ Označit vše jako přečtené
        </button>
      </div>

      {error && (
        <div className="request-alert request-alert-error">
          <span className="request-alert-icon">!</span>
          <div>
            <strong>Chyba</strong>
            <div>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="request-alert request-alert-success">
          <span className="request-alert-icon">✓</span>
          <div>
            <strong>Hotovo</strong>
            <div>{success}</div>
          </div>
        </div>
      )}

      {manage && (
        <div className="notification-compose-card">
          <div className="notification-compose-heading">
            <div>
              <span className="notification-compose-icon">🔔</span>
              <div>
                <h2>Odeslat notifikaci</h2>
                <p>
                  Admin a dispečer mohou poslat zprávu jednomu uživateli nebo všem.
                  Fotka je volitelná.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={sendNotification}>
            <div className="notification-compose-grid">
              <div className="notification-field">
                <label>Příjemce</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  required
                >
                  <option value="">Vyber příjemce…</option>
                  <option value="__all__">📢 Všichni uživatelé</option>

                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.jmeno || profile.id} — {getRoleName(profile.role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="notification-field">
                <label>Typ notifikace</label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                >
                  <option value="OBECNÁ">OBECNÁ</option>
                  <option value="INFORMACE">INFORMACE</option>
                  <option value="DŮLEŽITÉ">DŮLEŽITÉ</option>
                  <option value="UPOZORNĚNÍ">UPOZORNĚNÍ</option>
                  <option value="VOZIDLO">VOZIDLO</option>
                  <option value="VÝPRAVA">VÝPRAVA</option>
                </select>
              </div>
            </div>

            <div className="notification-field">
              <label>Zpráva</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Napiš text notifikace…"
                rows={5}
                required
              />
            </div>

            <div className="notification-upload-box">
              <div className="notification-upload-top">
                <div>
                  <strong>📷 Fotka</strong>
                  <span>JPG, PNG nebo WebP · maximálně 5 MB</span>
                </div>

                <label className="notification-file-button">
                  Vybrat fotku
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={chooseImage}
                  />
                </label>
              </div>

              {imagePreview && (
                <div className="notification-image-preview-wrap">
                  <img
                    src={imagePreview}
                    alt="Náhled vybrané fotky"
                    className="notification-image-preview"
                  />

                  <button
                    type="button"
                    className="notification-remove-image"
                    onClick={removeSelectedImage}
                  >
                    ✕ Odebrat fotku
                  </button>
                </div>
              )}
            </div>

            <div className="notification-compose-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={sending}
              >
                {sending ? "Odesílám…" : "📨 Odeslat notifikaci"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="notifications-list">
        {items.length === 0 ? (
          <div className="notification-empty">
            <div>🔔</div>
            <strong>Žádné notifikace</strong>
            <span>Až se něco stane, zobrazí se to tady.</span>
          </div>
        ) : (
          items.map((notification) => (
            <article
              className={`notification-card ${
                notification.precteno ? "" : "unread"
              }`}
              key={notification.id}
            >
              <div className="notification-card-header">
                <div>
                  <span className="notification-type">
                    {notification.typ || "OZNÁMENÍ"}
                  </span>

                  <small>
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString("cs-CZ")
                      : "—"}
                  </small>
                </div>

                {!notification.precteno && (
                  <span className="notification-unread-badge">NOVÉ</span>
                )}
              </div>

              <div className="notification-message">
                {notification.zprava}
              </div>

              {notification.image_url && (
                <a
                  href={notification.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="notification-image-link"
                  title="Otevřít fotku v plné velikosti"
                >
                  <img
                    src={notification.image_url}
                    alt="Fotka v notifikaci"
                    className="notification-image"
                    loading="lazy"
                  />
                </a>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function VehicleReleaseRequests({ user, profile, adminMode=false }) {
  const [rows,setRows]=useState([]),[vehicles,setVehicles]=useState([]),[error,setError]=useState(""),[success,setSuccess]=useState("");
  async function load(){ setError(""); const rq=await supabase.from("vehicle_release_requests").select("*").order("created_at",{ascending:false}); const vz=await supabase.from("vozy").select("id,cislo,ridic_1,ridic_2,ridic_1_pridelen_at,ridic_2_pridelen_at"); if(rq.error)setError(rq.error.message); setRows(adminMode?(rq.data||[]):((rq.data||[]).filter(x=>x.uzivatel_id===user.id))); setVehicles(vz.data||[]); }
  useEffect(()=>{load();},[user.id,adminMode]);
  const myName=(profile?.jmeno||"").trim();
  function eligible(v){ const d=v.ridic_1===myName?v.ridic_1_pridelen_at:v.ridic_2===myName?v.ridic_2_pridelen_at:null; return d && new Date() >= new Date(new Date(d).setMonth(new Date(d).getMonth()+3)); }
  async function requestRelease(v){ if(!eligible(v)){setError("O odevzdání lze požádat až po 3 měsících od přidělení.");return;} const active=rows.some(r=>r.vuz_id===v.id&&r.uzivatel_id===user.id&&r.stav==="ČEKÁ NA VYŘÍZENÍ"); if(active){setError("Žádost o odevzdání už čeká na vyřízení.");return;} const {error}=await supabase.from("vehicle_release_requests").insert({uzivatel_id:user.id,vuz_id:v.id,stav:"ČEKÁ NA VYŘÍZENÍ"}); if(error)setError(error.message); else {setSuccess("Žádost o odevzdání byla odeslána.");load();} }
  async function decide(r,stav){ const v=vehicles.find(x=>x.id===r.vuz_id); if(stav==="SCHVÁLENO"&&v){ const name=v.ridic_1===myName&&r.uzivatel_id===user.id?myName:null; const {data:p}=await supabase.from("profiles").select("jmeno").eq("id",r.uzivatel_id).maybeSingle(); const n=(p?.jmeno||name||"").trim(); let payload={}; if(v.ridic_1===n) payload={ridic_1:v.ridic_2||null,ridic_1_pridelen_at:v.ridic_2? v.ridic_2_pridelen_at:null,ridic_2:null,ridic_2_pridelen_at:null}; else if(v.ridic_2===n) payload={ridic_2:null,ridic_2_pridelen_at:null}; if(Object.keys(payload).length) await supabase.from("vozy").update(payload).eq("id",v.id); await supabase.from("vehicle_history").insert({vuz_id:v.id,uzivatel_id:r.uzivatel_id,typ:"RIDIC_ODEBRAN",popis:`${n} odevzdal vůz.`}); } await supabase.from("vehicle_release_requests").update({stav,vyrizeno_at:new Date().toISOString()}).eq("id",r.id); await supabase.from("notifications").insert({uzivatel_id:r.uzivatel_id,typ:"ODEVZDANI_VOZU",zprava:`Žádost o odevzdání vozu byla změněna na ${stav}.`}); load(); }
  const assigned=vehicles.filter(v=>v.ridic_1===myName||v.ridic_2===myName);
  return <div><div className="topbar"><div><h1>Odevzdání vozu</h1><p>Žádost je možná po 3 měsících od přidělení</p></div></div>{error&&<div className="error-box">{error}</div>}{success&&<div className="success-box">{success}</div>}{!adminMode&&<div className="panel"><h2>Přidělené vozy</h2>{assigned.length===0?<div className="empty">Nemáš přidělený vůz.</div>:assigned.map(v=><div className="simple-list-item" key={v.id}><strong>Vůz {v.cislo}</strong><button className="primary-button" disabled={!eligible(v)} onClick={()=>requestRelease(v)}>{eligible(v)?"Požádat o odevzdání":"Ještě neuplynuly 3 měsíce"}</button></div>)}</div>}<div className="panel"><h2>{adminMode?"Žádosti k vyřízení":"Moje žádosti"}</h2>{rows.length===0?<div className="empty">Žádné žádosti.</div>:rows.map(r=><div className="simple-list-item" key={r.id}><div><strong>Vůz {vehicles.find(v=>v.id===r.vuz_id)?.cislo||r.vuz_id}</strong><div>{r.stav}</div></div>{adminMode&&<select value={r.stav} onChange={e=>decide(r,e.target.value)}><option>ČEKÁ NA VYŘÍZENÍ</option><option>SCHVÁLENO</option><option>ZAMÍTNUTO</option></select>}</div>)}</div></div>;
}

function VehicleFaults({ user, role }) {
 const manage=canManageVehicles(role); const [rows,setRows]=useState([]),[vehicles,setVehicles]=useState([]),[form,setForm]=useState({vuz_id:"",nazev:"",popis:"",zavaznost:"BĚŽNÁ"}),[error,setError]=useState("");
 async function load(){const [a,b]=await Promise.all([supabase.from("vehicle_faults").select("*").order("created_at",{ascending:false}),supabase.from("vozy").select("id,cislo").order("cislo")]); if(a.error)setError(a.error.message); setRows(a.data||[]);setVehicles(b.data||[])} useEffect(()=>{load()},[]);
 async function add(e){e.preventDefault();const {error}=await supabase.from("vehicle_faults").insert({...form,vuz_id:Number(form.vuz_id),uzivatel_id:user.id});if(error)setError(error.message);else{await supabase.from("vehicle_history").insert({vuz_id:Number(form.vuz_id),uzivatel_id:user.id,typ:"ZAVADA",popis:`Nahlášena závada: ${form.nazev}`});setForm({vuz_id:"",nazev:"",popis:"",zavaznost:"BĚŽNÁ"});load()}}
 async function status(r,stav){await supabase.from("vehicle_faults").update({stav,vyreseno_at:stav==="OPRAVENO"?new Date().toISOString():null}).eq("id",r.id);load()}
 return <div><div className="topbar"><div><h1>Závady vozů</h1><p>Evidence a řešení závad</p></div></div>{error&&<div className="error-box">{error}</div>}<div className="panel"><h2>Nahlásit závadu</h2><form onSubmit={add} className="form-grid"><select value={form.vuz_id} onChange={e=>setForm({...form,vuz_id:e.target.value})} required><option value="">Vyber vůz</option>{vehicles.map(v=><option key={v.id} value={v.id}>Vůz {v.cislo}</option>)}</select><input placeholder="Název závady" value={form.nazev} onChange={e=>setForm({...form,nazev:e.target.value})} required/><select value={form.zavaznost} onChange={e=>setForm({...form,zavaznost:e.target.value})}><option>BĚŽNÁ</option><option>VÁŽNÁ</option><option>KRITICKÁ</option></select><input placeholder="Popis" value={form.popis} onChange={e=>setForm({...form,popis:e.target.value})}/><button className="primary-button">Nahlásit</button></form></div><div className="panel simple-list">{rows.map(r=><div className="simple-list-item" key={r.id}><div><strong>Vůz {vehicles.find(v=>v.id===r.vuz_id)?.cislo||r.vuz_id} · {r.nazev}</strong><div>{r.zavaznost} · {r.popis||"Bez popisu"}</div></div>{manage?<select value={r.stav} onChange={e=>status(r,e.target.value)}><option>NOVÁ</option><option>ŘEŠÍ SE</option><option>OPRAVENO</option></select>:<strong>{r.stav}</strong>}</div>)}</div></div>
}

function Departures({ role }) { const manage=canManageVehicles(role); const [rows,setRows]=useState([]),[vehicles,setVehicles]=useState([]),[drivers,setDrivers]=useState([]),[form,setForm]=useState({datum:new Date().toISOString().slice(0,10),linka:"",poradi:"",vuz_id:"",ridic_id:"",zacatek:"",konec:"",poznamka:""}); async function load(){const [a,b,c]=await Promise.all([supabase.from("vypravy").select("*").order("datum",{ascending:false}),supabase.from("vozy").select("id,cislo,ridic_1,ridic_2"),supabase.from("profiles").select("id,jmeno").eq("role","ridic")]);setRows(a.data||[]);setVehicles(b.data||[]);setDrivers(c.data||[])} useEffect(()=>{load()},[]); async function add(e){e.preventDefault();await supabase.from("vypravy").insert({...form,vuz_id:Number(form.vuz_id),ridic_id:form.ridic_id||null});load()} return <div><div className="topbar"><div><h1>Výpravy</h1><p>Tabulka výprav vozů a řidičů</p></div></div>{manage&&<div className="panel"><form className="form-grid" onSubmit={add}><input type="date" value={form.datum} onChange={e=>setForm({...form,datum:e.target.value})} required/><input placeholder="Linka" value={form.linka} onChange={e=>setForm({...form,linka:e.target.value})} required/><input placeholder="Pořadí" value={form.poradi} onChange={e=>setForm({...form,poradi:e.target.value})}/><select value={form.vuz_id} onChange={e=>setForm({...form,vuz_id:e.target.value})} required><option value="">Vůz</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.cislo}</option>)}</select><select value={form.ridic_id} onChange={e=>setForm({...form,ridic_id:e.target.value})}><option value="">Řidič</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.jmeno}</option>)}</select><input type="time" value={form.zacatek} onChange={e=>setForm({...form,zacatek:e.target.value})}/><input type="time" value={form.konec} onChange={e=>setForm({...form,konec:e.target.value})}/><input placeholder="Poznámka" value={form.poznamka} onChange={e=>setForm({...form,poznamka:e.target.value})}/><button className="primary-button">Přidat výpravu</button></form></div>}<div className="panel table-scroll"><table className="data-table"><thead><tr><th>Datum</th><th>Linka</th><th>Pořadí</th><th>Vůz</th><th>Řidič</th><th>Začátek</th><th>Konec</th><th>Poznámka</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.datum}</td><td>{r.linka}</td><td>{r.poradi||"-"}</td><td>{vehicles.find(v=>v.id===r.vuz_id)?.cislo||r.vuz_id}</td><td>{drivers.find(d=>d.id===r.ridic_id)?.jmeno||"-"}</td><td>{r.zacatek||"-"}</td><td>{r.konec||"-"}</td><td>{r.poznamka||"-"}</td></tr>)}</tbody></table></div></div> }

function AuditLog(){const [rows,setRows]=useState([]);useEffect(()=>{supabase.from("audit_log").select("*").order("created_at",{ascending:false}).limit(200).then(({data})=>setRows(data||[]))},[]);return <div><div className="topbar"><div><h1>Audit log</h1><p>Historie administrativních změn</p></div></div><div className="panel simple-list">{rows.map(r=><div className="simple-list-item" key={r.id}><div><strong>{r.akce}</strong><div>{r.entita} {r.entita_id||""} · {r.detail||""}</div></div><small>{new Date(r.created_at).toLocaleString("cs-CZ")}</small></div>)}</div></div>}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    vypravy: 0,
    aktivniVozy: 0,
    vozyCelkem: 0,
    provozovny: 0,
    zavady: 0,
    cekajiciZadosti: 0,
    stkBrzy: 0,
  });

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] =
    useState(false);

  const [page, setPage] = useState("dashboard");
  const [showRegister, setShowRegister] =
    useState(false);

  async function loadDashboardStats() {
    const today = new Date().toISOString().slice(0,10);
    const limit = new Date(); limit.setDate(limit.getDate()+30);
    const [p,v,a,vy,z,q,stk] = await Promise.all([
      supabase.from("provozovny").select("*",{count:"exact",head:true}),
      supabase.from("vozy").select("*",{count:"exact",head:true}),
      supabase.from("vozy").select("*",{count:"exact",head:true}).eq("stav","PROVOZNÍ"),
      supabase.from("vypravy").select("*",{count:"exact",head:true}).eq("datum",today),
      supabase.from("vehicle_faults").select("*",{count:"exact",head:true}).neq("stav","OPRAVENO"),
      supabase.from("zadosti_vozidla").select("*",{count:"exact",head:true}).eq("stav","ČEKÁ NA VYŘÍZENÍ"),
      supabase.from("vozy").select("*",{count:"exact",head:true}).gte("stk",today).lte("stk",limit.toISOString().slice(0,10)),
    ]);
    setDashboardStats({vypravy:vy.count||0,aktivniVozy:a.count||0,vozyCelkem:v.count||0,provozovny:p.count||0,zavady:z.count||0,cekajiciZadosti:q.count||0,stkBrzy:stk.count||0});
  }

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
          await loadDashboardStats();
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
      await loadDashboardStats();
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
            await loadDashboardStats();
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
  const manageNews = canManageNews(role);

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

            <button
              className={
                page === "members"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("members")
              }
            >
              <span>👥</span>
              Členové
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

            <button
              className={
                page === "vehicleRequest"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("vehicleRequest")
              }
            >
              <span>📝</span>
              Žádost o přidělení vozidla
            </button>

            <button className={page === "notifications" ? "active" : ""} onClick={() => setPage("notifications")}><span>🔔</span>Notifikace</button>
            <button className={page === "releaseRequests" ? "active" : ""} onClick={() => setPage("releaseRequests")}><span>↩</span>Odevzdání vozu</button>
            <button className={page === "faults" ? "active" : ""} onClick={() => setPage("faults")}><span>⚠</span>Závady</button>

            {(manageVehicles ||
              manageReports ||
              manageUsers ||
              manageNews) && (
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


            {manageVehicles && (
              <button
                className={
                  page === "adminVehicleRequests"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("adminVehicleRequests")
                }
              >
                <span>📝</span>
                Žádosti o přidělení vozidla
              </button>
            )}
            {manageVehicles && <button className={page === "adminReleaseRequests" ? "active" : ""} onClick={() => setPage("adminReleaseRequests")}><span>↩</span>Žádosti o odevzdání</button>}
            {manageVehicles && <button className={page === "audit" ? "active" : ""} onClick={() => setPage("audit")}><span>🕘</span>Audit log</button>}
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
    <strong>{dashboardStats.vypravy}</strong>
  </div>

  <div className="stat">
    <span>Aktivní vozy</span>
    <strong>{dashboardStats.aktivniVozy}</strong>
  </div>

  <div className="stat">
    <span>Vozy celkem</span>
    <strong>{dashboardStats.vozyCelkem}</strong>
  </div>

  <div className="stat"><span>Provozovny</span><strong>{dashboardStats.provozovny}</strong></div>
  <div className="stat"><span>Aktivní závady</span><strong>{dashboardStats.zavady}</strong></div>
  <div className="stat"><span>Čekající žádosti</span><strong>{dashboardStats.cekajiciZadosti}</strong></div>
  <div className="stat"><span>STK do 30 dní</span><strong>{dashboardStats.stkBrzy}</strong></div>
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

          {page === "departures" && <Departures role={role} />}

          {page === "news" && (
            <News
              user={user}
              profile={profile}
              role={role}
            />
          )}

          {page === "vehicles" && <Vehicles role={role} />}

          {page === "members" && <Members user={user} />}

          {page === "vehicleRequest" && (
            <VehicleRequest
              user={user}
              profile={profile}
            />
          )}

          {page === "notifications" && <Notifications user={user} role={role} />}
          {page === "releaseRequests" && <VehicleReleaseRequests user={user} profile={profile} />}
          {page === "faults" && <VehicleFaults user={user} role={role} />}
          {page === "adminReleaseRequests" && manageVehicles && <VehicleReleaseRequests user={user} profile={profile} adminMode />}
          {page === "audit" && manageVehicles && <AuditLog />}

          {page === "reports" &&
            useReports && (
              <MyReports user={user} />
            )}

          {page === "adminVehicles" &&
            manageVehicles && (
              <AdminVehicles />
            )}

          {page === "adminVehicleRequests" &&
            manageVehicles && (
              <AdminVehicleRequests />
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
.member-summary-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.member-summary-bar > div,
.member-stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.member-summary-bar span,
.member-stat-card span,
.member-card-stat span,
.member-report-card small {
  color: #718096;
  font-size: 12px;
}

.member-summary-bar strong,
.member-stat-card strong {
  font-size: 23px;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
}

.member-card {
  width: 100%;
  text-align: left;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 14px;
  align-items: center;
  cursor: pointer;
  color: #172033;
  transition: .15s ease;
}

.member-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 5px 18px rgba(15, 23, 42, .06);
}

.member-card-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #2563eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.member-card-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-card-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card-main small,
.member-card-stat small {
  color: #718096;
}

.member-card-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  white-space: nowrap;
}

.member-card-arrow {
  color: #64748b;
  font-size: 26px;
  line-height: 1;
}

.member-detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.member-reports-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-report-card {
  display: grid;
  grid-template-columns: 1.1fr 1fr .8fr 2fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.member-report-card > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.member-report-date strong {
  font-size: 14px;
}

.member-report-date small {
  color: #475569;
}

.member-report-route strong {
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .member-report-card {
    grid-template-columns: repeat(2, 1fr);
  }

  .member-report-route {
    grid-column: span 2;
  }
}

@media (max-width: 700px) {
  .member-summary-bar,
  .member-detail-stats {
    grid-template-columns: 1fr;
  }

  .member-card {
    grid-template-columns: auto 1fr auto;
  }

  .member-card-stat:nth-of-type(1),
  .member-card-stat:nth-of-type(2) {
    grid-column: 2 / 3;
  }
}

.request-helper {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

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

.vehicle-row-clickable {
  cursor: pointer;
  transition: background .15s ease, box-shadow .15s ease;
}

.vehicle-row-clickable:hover {
  background: #f8fafc;
}

.vehicle-row-clickable:focus {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  box-sizing: border-box;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
  text-align: center;
  line-height: 1.25;
}

.vehicle-row > * {
  min-width: 0;
}

.vehicle-row > span:last-child {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
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
    min-width: 0;
  }

  .vehicle-row > span:last-child {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .vehicle-status {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    padding: 5px 7px;
  }

  .provozovna-bar {
    flex-direction: column;
    align-items: stretch;
  }
}


  /* NOVINKY */
  .news-page {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .news-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .news-card {
    background: #ffffff;
    border: 1px solid #e1e6ef;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 4px 16px rgba(23, 32, 51, 0.05);
  }

  .news-card-confirmed {
    border-left: 4px solid #22a06b;
  }

  .news-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .news-card h2 {
    margin: 9px 0 6px;
    font-size: 21px;
  }

  .news-meta {
    color: #788397;
    font-size: 13px;
  }

  .news-priority {
    display: inline-flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 999px;
    background: #eef2f7;
    color: #526074;
    font-size: 12px;
    font-weight: 700;
  }

  .news-priority.important {
    background: #fff1d6;
    color: #9a6200;
  }

  .news-priority.urgent {
    background: #ffe1e1;
    color: #b42318;
  }

  .news-status {
    white-space: nowrap;
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }

  .news-status.confirmed {
    background: #e8f7ef;
    color: #16794c;
  }

  .news-status.pending {
    background: #fff1d6;
    color: #9a6200;
  }

  .news-content {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #edf0f5;
    white-space: pre-wrap;
    line-height: 1.65;
    color: #303b4f;
  }

  .news-card-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 20px;
  }

  .news-form-panel {
    padding: 22px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .news-form {
    display: grid;
    gap: 16px;
  }

  .news-form textarea {
    width: 100%;
    resize: vertical;
    min-height: 170px;
    padding: 12px 13px;
    border: 1px solid #d8deea;
    border-radius: 10px;
    background: #fff;
    color: #172033;
    font: inherit;
  }

  .news-form textarea:focus,
  .news-form input:focus,
  .news-form select:focus {
    outline: none;
    border-color: #4b72d8;
    box-shadow: 0 0 0 3px rgba(75, 114, 216, 0.12);
  }

  .news-form-actions {
    display: flex;
    justify-content: flex-end;
  }

  .primary-button,
  .secondary-button {
    border: 0;
    border-radius: 9px;
    padding: 10px 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary-button {
    background: #315fce;
    color: #fff;
  }

  .primary-button:hover {
    background: #274fae;
  }

  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary-button {
    background: #eef2f7;
    color: #2d3a50;
  }

  .secondary-button:hover {
    background: #e2e7ef;
  }

  .danger-button {
    color: #b42318;
  }

  .confirmed-text {
    color: #16794c;
    font-weight: 700;
    padding: 9px 0;
  }

  .news-confirmation-panel {
    margin-top: 18px;
    padding: 16px;
    background: #f7f9fc;
    border: 1px solid #e4e8ef;
    border-radius: 12px;
  }

  .news-confirmation-panel h3 {
    margin: 0 0 12px;
  }

  .news-driver-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .news-driver-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding: 10px 12px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e8ebf1;
  }

  .driver-confirmed {
    color: #16794c;
  }

  .driver-not-confirmed {
    color: #b42318;
  }

  .empty-state {
    text-align: center;
    padding: 50px 20px;
  }

  .empty-icon {
    font-size: 38px;
    margin-bottom: 8px;
  }

  .loading-inline {
    padding: 30px;
    text-align: center;
    color: #788397;
  }

  .error-box,
  .success-box {
    padding: 12px 15px;
    border-radius: 10px;
    font-weight: 600;
  }

  .error-box {
    background: #ffe8e8;
    color: #a51d1d;
    border: 1px solid #f2b8b8;
  }

  .success-box {
    background: #e8f7ef;
    color: #16794c;
    border: 1px solid #b8e4cd;
  }


/* =========================================================
   MODERNÍ UI – ŽÁDOST O PŘIDĚLENÍ VOZIDLA
========================================================= */

.request-page {
  max-width: 1180px;
  margin: 0 auto;
}

.request-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.request-eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
  color: #718096;
  margin-bottom: 7px;
}

.request-hero h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.12;
  color: #172033;
}

.request-hero p {
  margin: 8px 0 0;
  color: #718096;
  font-size: 14px;
}

.request-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  border: 1px solid #e4e9f1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 5px 18px rgba(23,32,51,.05);
}

.request-user-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2f6fed;
  box-shadow: 0 0 0 4px #eaf1ff;
}

.request-user strong {
  display: block;
  font-size: 13px;
}

.request-user small {
  display: block;
  margin-top: 2px;
  color: #8a94a6;
  font-size: 11px;
}

.request-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, .8fr);
  gap: 18px;
  align-items: start;
}

.request-card {
  background: #fff;
  border: 1px solid #e3e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(23,32,51,.055);
  overflow: hidden;
}

.request-card-main {
  padding: 24px;
}

.request-card-side {
  padding: 20px;
  position: sticky;
  top: 20px;
}

.request-card-heading {
  margin-bottom: 18px;
}

.request-card-heading > div {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.request-card-heading h2 {
  margin: 0;
  font-size: 18px;
  color: #172033;
}

.request-card-heading p {
  margin: 5px 0 0;
  color: #7a8496;
  font-size: 13px;
  line-height: 1.45;
}

.request-card-heading-spaced {
  margin-top: 28px;
}

.request-step {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: #eef4ff;
  color: #2563eb;
  font-weight: 800;
  font-size: 13px;
}

.request-field {
  margin-bottom: 18px;
}

.request-field label {
  display: block;
  margin: 0 0 8px;
  color: #253047;
  font-size: 13px;
  font-weight: 800;
}

.request-select-wrap {
  position: relative;
}

.request-select,
.request-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d6dce6;
  background: #fbfcfe;
  color: #172033;
  border-radius: 11px;
  outline: none;
  font-size: 14px;
  transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
}

.request-select {
  appearance: none;
  padding: 12px 42px 12px 13px;
}

.request-textarea {
  display: block;
  min-height: 150px;
  resize: vertical;
  padding: 13px 14px;
  line-height: 1.5;
  font-family: inherit;
}

.request-select:focus,
.request-textarea:focus {
  border-color: #6d94e8;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(37,99,235,.09);
}

.request-select-arrow {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-58%);
  pointer-events: none;
  color: #718096;
  font-size: 16px;
}

.request-vehicle-preview {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  margin: 4px 0 4px;
  border: 1px solid #dfe7f4;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff, #f2f6fc);
}

.request-vehicle-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #e9f0ff;
  font-size: 21px;
}

.request-vehicle-info {
  min-width: 0;
  flex: 1;
}

.request-vehicle-number {
  font-size: 12px;
  font-weight: 800;
  color: #2f6fed;
  margin-bottom: 2px;
}

.request-vehicle-name {
  font-size: 14px;
  font-weight: 800;
  color: #172033;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-vehicle-meta {
  margin-top: 3px;
  color: #7a8496;
  font-size: 12px;
}

.request-vehicle-status span {
  display: inline-flex;
  align-items: center;
  min-height: 27px;
  padding: 0 9px;
  border-radius: 999px;
  background: #eef6ef;
  color: #2f7d42;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.request-hint {
  margin-top: 7px;
  color: #8a94a6;
  font-size: 11px;
  line-height: 1.4;
}

.request-submit-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

.request-submit-button {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  border: 0;
  border-radius: 10px;
  padding: 12px 16px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(37,99,235,.2);
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}

.request-submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(37,99,235,.24);
}

.request-submit-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.request-submit-arrow {
  font-size: 16px;
}

.request-alert {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 13px;
}

.request-alert strong {
  display: block;
  margin-bottom: 2px;
}

.request-alert-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 900;
  flex: 0 0 auto;
}

.request-alert-error {
  border: 1px solid #f1c4c4;
  background: #fff5f5;
  color: #9b2c2c;
}

.request-alert-error .request-alert-icon {
  background: #fee2e2;
  color: #b91c1c;
}

.request-alert-success {
  border: 1px solid #c5e6d2;
  background: #f3fbf6;
  color: #267148;
}

.request-alert-success .request-alert-icon {
  background: #dcfce7;
  color: #15803d;
}

.request-loading,
.request-empty-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #7a8496;
}

.request-loading {
  gap: 10px;
}

.request-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid #e3e9f4;
  border-top-color: #2563eb;
  animation: requestSpin .8s linear infinite;
}

@keyframes requestSpin {
  to { transform: rotate(360deg); }
}

.request-empty-state {
  gap: 5px;
  padding: 35px 12px;
}

.request-empty-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.request-empty-state strong {
  color: #253047;
  font-size: 14px;
}

.request-empty-state span {
  color: #8a94a6;
  font-size: 12px;
}

.request-history {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.request-history-item {
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  padding: 12px;
  background: #fafbfd;
}

.request-history-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.request-history-top strong {
  display: block;
  font-size: 13px;
}

.request-history-top small {
  display: block;
  margin-top: 3px;
  color: #8a94a6;
  font-size: 10px;
}

.request-history-status {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f1f4f8;
  color: #526072;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.request-history-note {
  margin-top: 10px;
  padding-top: 9px;
  border-top: 1px solid #edf0f4;
  color: #4c586c;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .request-layout {
    grid-template-columns: 1fr;
  }

  .request-card-side {
    position: static;
  }

  .request-hero {
    align-items: flex-start;
    flex-direction: column;
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

.vehicle-extra-panel{margin-top:22px;padding-top:18px;border-top:1px solid #e5e7eb}.simple-list{display:flex;flex-direction:column;gap:10px}.simple-list-item{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;min-width:0}.simple-list-item>div{min-width:0}.simple-list-item.unread{border-left:4px solid #172033;background:#f8fafc}.table-scroll{overflow-x:auto}.data-table{width:100%;border-collapse:collapse;min-width:850px}.data-table th,.data-table td{text-align:left;padding:12px;border-bottom:1px solid #e5e7eb;white-space:nowrap}@media(max-width:700px){.simple-list-item{align-items:flex-start;flex-direction:column}.simple-list-item button,.simple-list-item select{width:100%}}

/* =========================================================
   ADMIN - ŽÁDOSTI O PŘIDĚLENÍ
========================================================= */
.assignment-admin-page {
  width: 100%;
  min-width: 0;
}

.assignment-admin-eyebrow {
  margin-bottom: 7px;
  color: #2f6fed;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
}

.assignment-admin-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 430px), 1fr));
  gap: 18px;
}

.assignment-admin-card {
  min-width: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e3e8f0;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(23, 32, 51, .06);
}

.assignment-admin-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #edf1f6;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
}

.assignment-admin-vehicle {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
}

.assignment-admin-bus-icon {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: #eaf1ff;
  font-size: 22px;
}

.assignment-admin-title {
  min-width: 0;
}

.assignment-admin-title > span {
  display: block;
  margin-bottom: 3px;
  color: #7b879b;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .09em;
}

.assignment-admin-title h3 {
  margin: 0;
  color: #172033;
  font-size: 19px;
  line-height: 1.2;
}

.assignment-admin-title p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  color: #68758a;
  font-size: 12px;
}

.assignment-status-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 190px;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 999px;
  text-align: center;
  font-size: 10px;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.assignment-status-badge.pending {
  background: #fff4d6;
  color: #93631a;
}

.assignment-status-badge.approved {
  background: #dcfce7;
  color: #18733a;
}

.assignment-status-badge.rejected {
  background: #fee2e2;
  color: #a52b2b;
}

.assignment-status-badge.done {
  background: #e9edf3;
  color: #526072;
}

.assignment-admin-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: #edf1f6;
  border-bottom: 1px solid #edf1f6;
}

.assignment-admin-info {
  min-width: 0;
  padding: 15px 18px;
  background: #fff;
}

.assignment-admin-info span {
  display: block;
  margin-bottom: 5px;
  color: #8994a6;
  font-size: 10px;
  font-weight: 800;
}

.assignment-admin-info strong {
  display: block;
  color: #263248;
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.assignment-admin-note {
  margin: 17px 20px;
  padding: 14px 15px;
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  background: #fafbfd;
}

.assignment-admin-note > span {
  display: block;
  margin-bottom: 7px;
  color: #7a8496;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.assignment-admin-note p {
  margin: 0;
  color: #3f4b5f;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.assignment-admin-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  padding: 0 20px 20px;
}

.assignment-admin-status-control {
  min-width: 0;
  flex: 1;
}

.assignment-admin-status-control label {
  display: block;
  margin-bottom: 6px;
  color: #7a8496;
  font-size: 10px;
  font-weight: 800;
}

.assignment-status-select {
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid #d6dce6;
  border-radius: 10px;
  background: #fff;
  color: #263248;
  font-weight: 700;
  outline: none;
}

.assignment-status-select:focus {
  border-color: #6d94e8;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .08);
}

.assignment-delete-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 14px;
  border: 1px solid #f0caca;
  border-radius: 10px;
  background: #fff3f3;
  color: #b42323;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: background .15s ease, transform .15s ease;
}

.assignment-delete-button:hover:not(:disabled) {
  background: #ffe6e6;
  transform: translateY(-1px);
}

.assignment-delete-button:disabled,
.assignment-status-select:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.assignment-admin-empty {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 30px;
  border: 1px solid #e3e8f0;
  border-radius: 18px;
  background: #fff;
  color: #7a8496;
  text-align: center;
}

.assignment-admin-empty strong {
  color: #2a3549;
}

.assignment-admin-empty-icon {
  font-size: 30px;
  margin-bottom: 3px;
}

@media (max-width: 760px) {
  .assignment-admin-list {
    grid-template-columns: 1fr;
  }

  .assignment-admin-card-head {
    flex-direction: column;
  }

  .assignment-status-badge {
    max-width: 100%;
    align-self: flex-start;
  }

  .assignment-admin-info-grid {
    grid-template-columns: 1fr;
  }

  .assignment-admin-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .assignment-delete-button {
    width: 100%;
  }
}


/* =========================================================
   NOTIFIKACE + FOTKY
========================================================= */
.notifications-page {
  width: 100%;
  min-width: 0;
}

.notifications-eyebrow {
  margin-bottom: 7px;
  color: #2f6fed;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
}

.notification-compose-card {
  margin-bottom: 20px;
  padding: 22px;
  border: 1px solid #dfe6ef;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(23, 32, 51, .055);
}

.notification-compose-heading {
  margin-bottom: 18px;
}

.notification-compose-heading > div {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notification-compose-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #eaf1ff;
  font-size: 19px;
}

.notification-compose-heading h2 {
  margin: 0;
  color: #172033;
  font-size: 18px;
}

.notification-compose-heading p {
  margin: 5px 0 0;
  color: #7a8496;
  font-size: 12px;
  line-height: 1.45;
}

.notification-compose-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.notification-field {
  min-width: 0;
  margin-bottom: 14px;
}

.notification-field label {
  display: block;
  margin-bottom: 7px;
  color: #344056;
  font-size: 12px;
  font-weight: 800;
}

.notification-field input,
.notification-field select,
.notification-field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d7dee9;
  border-radius: 11px;
  background: #fbfcfe;
  color: #172033;
  outline: none;
  font: inherit;
  font-size: 13px;
}

.notification-field input,
.notification-field select {
  min-height: 42px;
  padding: 9px 11px;
}

.notification-field textarea {
  display: block;
  min-height: 115px;
  padding: 12px;
  resize: vertical;
  line-height: 1.5;
}

.notification-field input:focus,
.notification-field select:focus,
.notification-field textarea:focus {
  border-color: #6d94e8;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .08);
}

.notification-upload-box {
  margin-top: 2px;
  padding: 15px;
  border: 1px dashed #ccd6e5;
  border-radius: 13px;
  background: #f9fbfe;
}

.notification-upload-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.notification-upload-top strong {
  display: block;
  color: #2c374b;
  font-size: 13px;
}

.notification-upload-top span {
  display: block;
  margin-top: 3px;
  color: #8590a2;
  font-size: 11px;
}

.notification-file-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid #cfd8e6;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.notification-file-button input {
  display: none;
}

.notification-image-preview-wrap {
  margin-top: 14px;
}

.notification-image-preview {
  display: block;
  width: min(100%, 520px);
  max-height: 320px;
  object-fit: cover;
  border: 1px solid #e1e7ef;
  border-radius: 13px;
  background: #eef2f7;
}

.notification-remove-image {
  margin-top: 9px;
  border: 0;
  background: transparent;
  color: #b42323;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.notification-compose-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.notification-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 18px;
  border: 1px solid #e1e7ef;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 7px 22px rgba(23, 32, 51, .045);
}

.notification-card.unread {
  border-left: 4px solid #2f6fed;
  background: linear-gradient(135deg, #ffffff, #f7faff);
}

.notification-card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 11px;
}

.notification-card-header small {
  display: block;
  margin-top: 4px;
  color: #8b95a6;
  font-size: 10px;
}

.notification-type {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #edf3ff;
  color: #2f6fed;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .04em;
}

.notification-unread-badge {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #dcfce7;
  color: #18733a;
  font-size: 9px;
  font-weight: 900;
}

.notification-message {
  color: #344056;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.notification-image-link {
  display: block;
  margin-top: 14px;
  border-radius: 13px;
  overflow: hidden;
  background: #eef2f7;
}

.notification-image {
  display: block;
  width: 100%;
  max-height: 430px;
  object-fit: contain;
  background: #eef2f7;
}

.notification-empty {
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 28px;
  border: 1px solid #e1e7ef;
  border-radius: 16px;
  background: #fff;
  color: #7d8798;
  text-align: center;
}

.notification-empty > div {
  font-size: 28px;
}

.notification-empty strong {
  color: #2b364a;
}

@media (max-width: 700px) {
  .notification-compose-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .notification-upload-top {
    align-items: stretch;
    flex-direction: column;
  }

  .notification-file-button {
    width: 100%;
    box-sizing: border-box;
  }

  .notification-compose-actions .primary-button {
    width: 100%;
  }

  .notification-card {
    padding: 15px;
  }
}

`;

export default App;
