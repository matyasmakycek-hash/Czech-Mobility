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

function VehicleDetail({ vehicle, role, onBack, onSaved }) {
  const editable = canManageVehicles(role);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...vehicle });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({ ...vehicle });
    setEditing(false);
    setError("");
    setSuccess("");
  }, [vehicle]);

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

    // Aktualizujeme pouze pole, která jsou skutečně přítomná
    // v načteném záznamu. Díky tomu můžeš doplňovat další
    // sloupce do tabulky `vozy` postupně bez rozbití detailu.
    const payload = {};

    vehicleDetailFields.forEach(([field]) => {
      if (Object.prototype.hasOwnProperty.call(form, field)) {
        let value = form[field];

        if (field === "rok") {
          value = value === "" || value == null
            ? null
            : Number(value);
        } else if (value === "") {
          value = null;
        }

        payload[field] = value;
      }
    });

    const { data, error: saveError } = await supabase
      .from("vozy")
      .update(payload)
      .eq("id", vehicle.id)
      .select("*")
      .single();

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setForm(data || form);
    setEditing(false);
    setSuccess("Údaje vozu byly uloženy.");
    setSaving(false);

    if (onSaved) {
      onSaved(data || form);
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
                  <input
                    className="form-input"
                    type={field === "rok" ? "number" : "text"}
                    value={form[field] ?? ""}
                    onChange={(e) => change(field, e.target.value)}
                    placeholder={label}
                  />
                )
              ) : (
                <div style={{ fontWeight: 600 }}>
                  {form[field] === null ||
                  form[field] === undefined ||
                  form[field] === ""
                    ? "—"
                    : String(form[field])}
                </div>
              )}
            </div>
          ))}
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

    // Záměrně načítáme jen sloupce, které v původní databázi
    // prokazatelně existují. Detailní položky, které si doplníš
    // později do `vozy`, se zobrazí jako —.
    const { data, error } = await supabase
      .from("vozy")
      .select(
        "id, cislo, vyrobce, typ, spz, rok, barevne_schema, stav, provozovna_id, vytvoreno"
      )
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
                      Napiš dodatek k přidělení vozidla, např. šel by tuning?
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
                  placeholder="Napiš dodatek k přidělení vozidla, např. šel by tuning?"
                  rows={7}
                  required
                />
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

    const { error: updateError } = await supabase
      .from("zadosti_vozidla")
      .update({ stav })
      .eq("id", id);

    setSavingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Stav žádosti byl změněn.");
    await loadRequests();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Žádosti o přidělení vozidla</h1>
          <p>Vyřízení žádostí o konkrétní vůz</p>
        </div>
        <div className="profile-badge">
          {requests.length} ŽÁDOSTÍ
        </div>
      </div>

      {error && <div className="error-box"><strong>Chyba:</strong><br />{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {loading ? (
        <div className="empty">Načítání žádostí...</div>
      ) : requests.length === 0 ? (
        <div className="empty">Zatím nebyla vytvořena žádná žádost.</div>
      ) : (
        <div className="admin-reports-list">
          {requests.map((request) => {
            const user = profiles[request.uzivatel_id];
            const vehicle = vehicles[request.vuz_id];

            return (
              <article className="admin-report-card" key={request.id}>
                <div className="admin-report-header">
                  <div>
                    <span className="admin-report-date">
                      {request.created_at
                        ? new Date(request.created_at).toLocaleString("cs-CZ")
                        : "-"}
                    </span>
                    <h3>
                      Vůz {vehicle?.cislo ?? "-"}
                    </h3>
                  </div>

                  <select
                    className="status-select"
                    value={request.stav || "ČEKÁ NA VYŘÍZENÍ"}
                    onChange={(e) => changeStatus(request.id, e.target.value)}
                    disabled={savingId === request.id}
                  >
                    <option value="ČEKÁ NA VYŘÍZENÍ">ČEKÁ NA VYŘÍZENÍ</option>
                    <option value="SCHVÁLENO">SCHVÁLENO</option>
                    <option value="ZAMÍTNUTO">ZAMÍTNUTO</option>
                    <option value="VYŘÍZENO">VYŘÍZENO</option>
                  </select>
                </div>

                <div className="admin-report-grid">
                  <div>
                    <small>Žadatel</small>
                    <strong>{user?.jmeno || request.uzivatel_id || "-"}</strong>
                  </div>
                  <div>
                    <small>Vozidlo</small>
                    <strong>
                      {vehicle
                        ? `${vehicle.vyrobce || ""} ${vehicle.typ || ""}${vehicle.spz ? ` • ${vehicle.spz}` : ""}`.trim()
                        : request.vuz_id || "-"}
                    </strong>
                  </div>
                </div>

                <div className="panel" style={{ marginTop: "12px" }}>
                  <small>Poznámka žadatele</small>
                  <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                    {request.poznamka || "Bez poznámky"}
                  </p>
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

  async function loadDashboardStats() {
    const [
      { count: provozovny, error: provozovnyError },
      { count: vozyCelkem, error: vozyError },
      { count: aktivniVozy, error: aktivniVozyError },
    ] = await Promise.all([
      supabase
        .from("provozovny")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("vozy")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("vozy")
        .select("*", { count: "exact", head: true })
        .eq("stav", "PROVOZNÍ"),
    ]);

    if (provozovnyError) {
      console.error("PROVOZOVNY ERROR:", provozovnyError);
    }

    if (vozyError) {
      console.error("VOZY ERROR:", vozyError);
    }

    if (aktivniVozyError) {
      console.error("AKTIVNI VOZY ERROR:", aktivniVozyError);
    }

    setDashboardStats({
      vypravy: 0,
      aktivniVozy: aktivniVozy || 0,
      vozyCelkem: vozyCelkem || 0,
      provozovny: provozovny || 0,
    });
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

  <div className="stat">
    <span>Provozovny</span>
    <strong>{dashboardStats.provozovny}</strong>
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

          {page === "news" && (
            <News
              user={user}
              profile={profile}
              role={role}
            />
          )}

          {page === "vehicles" && <Vehicles role={role} />}

          {page === "vehicleRequest" && (
            <VehicleRequest
              user={user}
              profile={profile}
            />
          )}

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
`;

export default App;
