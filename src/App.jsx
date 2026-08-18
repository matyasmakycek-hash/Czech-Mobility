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
        <div className="login-logo"><img src="/cm-logo.png" alt="CM" /></div>

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
        <div className="login-logo"><img src="/cm-logo.png" alt="CM" /></div>

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

function getCourseDayLabel(value) {
  if (value === "PD") return "Pracovní den";
  if (value === "VIKEND") return "Víkend";
  if (value === "NE") return "Neděle";
  if (value === "DENNE") return "Každý den";
  return "Bez omezení dne";
}

const MAIN_PROVOZOVNA_CODES = ["WRO", "400", "BUK", "BRE", "BRN"];

function getMainProvozovny(provozovny = []) {
  return MAIN_PROVOZOVNA_CODES
    .map((code) =>
      provozovny.find(
        (provozovna) =>
          String(provozovna.kod || "").toUpperCase().trim() === code
      )
    )
    .filter(Boolean);
}

function ProvozovnaSelect({
  value,
  onChange,
  provozovny,
  label = "Provozovna",
  required = false,
}) {
  const visibleProvozovny = getMainProvozovny(provozovny);

  return (
    <div>
      <label>{label}</label>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Vyber provozovnu</option>

        {visibleProvozovny.map((provozovna) => (
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
  stk: "",
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
            <label>STK – platnost do</label>

            <input
              type="date"
              value={form.stk || ""}
              onChange={(e) => change("stk", e.target.value)}
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

      stk: form.stk || null,

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

                  <small>
                    STK do:{" "}
                    {vehicle.stk
                      ? formatStkForDisplay(vehicle.stk)
                      : "-"}
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
                        stk: normalizeStkForInput(vehicle.stk),
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

function normalizeStkForInput(value) {
  if (!value) return "";

  const raw = String(value).trim();

  // PostgreSQL date -> HTML input[type=date]
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Legacy MM/YYYY -> first day of month, until user sets exact day.
  const monthYear = raw.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);
  if (monthYear) {
    return `${monthYear[2]}-${String(monthYear[1]).padStart(2, "0")}-01`;
  }

  // Legacy DD.MM.YYYY
  const czDate = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (czDate) {
    return `${czDate[3]}-${String(czDate[2]).padStart(2, "0")}-${String(
      czDate[1]
    ).padStart(2, "0")}`;
  }

  return "";
}

function formatStkForDisplay(value) {
  if (!value) return "";

  const normalized = normalizeStkForInput(value);
  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (iso) {
    return `${iso[3]}.${iso[2]}.${iso[1]}`;
  }

  return String(value);
}

function stkInputToDate(value) {
  if (!value) return null;

  const normalized = normalizeStkForInput(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

function localDateIso(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStkStatus(value) {
  const normalized = normalizeStkForInput(value);
  if (!normalized) return null;

  const target = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      type: "expired",
      text: `STK propadla před ${Math.abs(diffDays)} dny`,
    };
  }

  if (diffDays === 0) {
    return { type: "soon", text: "STK končí dnes" };
  }

  if (diffDays <= 30) {
    return {
      type: "soon",
      text: `STK končí za ${diffDays} dní`,
    };
  }

  return { type: "ok", text: `STK platí ještě ${diffDays} dní` };
}


function vehicleDraftKey(vehicleId) {
  return `cm-vehicle-edit-draft-${vehicleId}`;
}

function readVehicleDraft(vehicleId) {
  if (typeof window === "undefined" || !vehicleId) return null;

  try {
    const raw = window.localStorage.getItem(vehicleDraftKey(vehicleId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("VEHICLE DRAFT READ ERROR:", error);
    return null;
  }
}

function clearVehicleDraft(vehicleId) {
  if (typeof window === "undefined" || !vehicleId) return;

  try {
    window.localStorage.removeItem(vehicleDraftKey(vehicleId));
  } catch (error) {
    console.warn("VEHICLE DRAFT CLEAR ERROR:", error);
  }
}

function VehicleDetail({ vehicle, role, onBack, onSaved }) {
  const editable = canManageVehicles(role);
  const initialDraft = readVehicleDraft(vehicle.id);

  const [editing, setEditing] = useState(
    Boolean(initialDraft?.form)
  );
  const [form, setForm] = useState(() => ({
    ...vehicle,
    ...(initialDraft?.form || {}),
    stk: normalizeStkForInput(
      initialDraft?.form?.stk ?? vehicle.stk
    ),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const draft = readVehicleDraft(vehicle.id);

    if (draft?.form) {
      setForm({
        ...vehicle,
        ...draft.form,
        stk: normalizeStkForInput(
          draft.form.stk ?? vehicle.stk
        ),
      });
      setEditing(true);
    } else {
      setForm({
        ...vehicle,
        stk: normalizeStkForInput(vehicle.stk),
      });
      setEditing(false);
    }

    setError("");
    setSuccess("");
  }, [vehicle.id]);

  useEffect(() => {
    if (!editing || !vehicle.id || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        vehicleDraftKey(vehicle.id),
        JSON.stringify({
          form,
          updated_at: new Date().toISOString(),
        })
      );
    } catch (draftError) {
      console.warn("VEHICLE DRAFT SAVE ERROR:", draftError);
    }
  }, [editing, form, vehicle.id]);

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

  function startEditing() {
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    clearVehicleDraft(vehicle.id);
    setForm({
      ...vehicle,
      stk: normalizeStkForInput(vehicle.stk),
    });
    setEditing(false);
    setError("");
    setSuccess("");
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
    stk: normalizeStkForInput(data?.stk),
  };

  clearVehicleDraft(vehicle.id);
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
              onClick={editing ? cancelEditing : startEditing}
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

      {editing && (
        <div className="vehicle-draft-info">
          <span>●</span>
          Rozepsané změny se průběžně ukládají v tomto prohlížeči.
          Přepnutí záložky je nesmaže.
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
              className="vehicle-detail-field-card"
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <div
                className="vehicle-detail-field-label"
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
                      type={
                        field === "stk"
                          ? "date"
                          : field === "rok"
                          ? "number"
                          : "text"
                      }
                      value={form[field] ?? ""}
                      onChange={(e) => change(field, e.target.value)}
                      placeholder={label}
                    />
                  </>
                )
              ) : (
                <>
                  <div style={{ fontWeight: 600 }}>
                    {form[field] === null ||
                    form[field] === undefined ||
                    form[field] === ""
                      ? "—"
                      : field === "stk"
                      ? formatStkForDisplay(form[field])
                      : String(form[field])}
                  </div>

                  {field === "stk" &&
                    form[field] &&
                    getStkStatus(form[field]) && (
                      <div
                        className={`stk-status-note ${getStkStatus(form[field]).type}`}
                      >
                        {getStkStatus(form[field]).text}
                      </div>
                    )}
                </>
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
          className="vehicle-detail-note"
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

function Vehicles({ role, initialVehicleId = null, onVehicleOpened }) {
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

  useEffect(() => {
    if (!initialVehicleId) return;

    setSelectedVehicleId(initialVehicleId);

    if (onVehicleOpened) {
      onVehicleOpened();
    }
  }, [initialVehicleId]);

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
  const isDriver = role === ROLE_RIDIC;

  const [items, setItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? window.Notification.permission
      : "unsupported"
  );

  const [recipientId, setRecipientId] = useState("");
  const [notificationType, setNotificationType] = useState("OBECNÁ");
  const [message, setMessage] = useState("");
  const [requiresConfirmation, setRequiresConfirmation] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState("OBECNÁ");
  const [editMessage, setEditMessage] = useState("");
  const [editRequiresConfirmation, setEditRequiresConfirmation] = useState(true);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editRemoveImage, setEditRemoveImage] = useState(false);

  const notificationTypes = [
    "OBECNÁ",
    "INFORMACE",
    "DŮLEŽITÉ",
    "UPOZORNĚNÍ",
    "VOZIDLO",
    "VÝPRAVA",
  ];

  function getProfile(id) {
    return profiles.find((profile) => String(profile.id) === String(id));
  }


  // Jedna rozesílka může mít v DB více řádků (jeden pro každého příjemce).
  // V administraci je ale zobrazíme jako JEDNU kartu.
  const sentGroups = sentItems.reduce((groups, notification) => {
    const key = `${notification.odesilatel_id || "sender"}::${
      notification.created_at || notification.id
    }`;

    let group = groups.find((item) => item.key === key);

    if (!group) {
      group = {
        key,
        items: [],
        first: notification,
      };
      groups.push(group);
    }

    group.items.push(notification);
    return groups;
  }, []);

  function getGroupRecipientNames(group) {
    const names = group.items.map((notification) => {
      const profile = getProfile(notification.uzivatel_id);
      return profile?.jmeno || notification.uzivatel_id;
    });

    if (names.length <= 4) return names.join(", ");

    return `${names.slice(0, 4).join(", ")} +${names.length - 4}`;
  }

  function getGroupConfirmation(group) {
    const first = group.first;

    if (!first.vyzaduje_potvrzeni) {
      return {
        label: "Potvrzení se nevyžaduje",
        confirmed: true,
      };
    }

    const driverItems = group.items.filter((notification) => {
      const profile = getProfile(notification.uzivatel_id);
      return profile?.role === ROLE_RIDIC;
    });

    if (driverItems.length === 0) {
      return {
        label: "Bez řidičů k potvrzení",
        confirmed: true,
      };
    }

    const confirmedCount = driverItems.filter(
      (notification) => notification.potvrzeno
    ).length;

    return {
      label: `${confirmedCount}/${driverItems.length} řidičů potvrdilo`,
      confirmed: confirmedCount === driverItems.length,
    };
  }

  async function load() {
    setError("");

    const ownQuery = supabase
      .from("notifications")
      .select("*")
      .eq("uzivatel_id", user.id)
      .order("created_at", { ascending: false });

    const sentQuery = manage
      ? supabase
          .from("notifications")
          .select("*")
          .not("odesilatel_id", "is", null)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const [ownResult, sentResult] = await Promise.all([ownQuery, sentQuery]);

    if (ownResult.error) {
      setError(ownResult.error.message);
      setItems([]);
    } else {
      setItems(ownResult.data || []);
    }

    if (manage) {
      if (sentResult.error) {
        setError((old) => old || sentResult.error.message);
        setSentItems([]);
      } else {
        setSentItems(sentResult.data || []);
      }
    } else {
      setSentItems([]);
    }
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
  }, [user.id, manage]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-page-${user.id}-${manage ? "manage" : "own"}`)
      .on(
        "postgres_changes",
        manage
          ? {
              event: "*",
              schema: "public",
              table: "notifications",
            }
          : {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `uzivatel_id=eq.${user.id}`,
            },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, manage]);

  useEffect(() => {
    loadProfiles();
  }, [manage]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    };
  }, [imagePreview, editImagePreview]);

  async function enableBrowserNotifications() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      setError("Tento prohlížeč nepodporuje systémová oznámení.");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setBrowserPermission(permission);

      if (permission === "granted") {
        setSuccess("Systémová oznámení byla zapnuta.");
        setError("");
      } else if (permission === "denied") {
        setError(
          "Oznámení jsou v prohlížeči zakázaná. Povol je v nastavení webu."
        );
      }
    } catch (permissionError) {
      setError(
        permissionError?.message ||
          "Nepodařilo se požádat o povolení oznámení."
      );
    }
  }

  async function markAll() {
    setError("");

    const { error: markError } = await supabase.rpc(
      "mark_my_notifications_read"
    );

    if (markError) {
      setError(markError.message);
      return;
    }

    await load();
  }

  async function confirmNotification(notification) {
    if (!isDriver) return;

    setError("");
    setSuccess("");
    setBusyId(notification.id);

    const { error: confirmError } = await supabase.rpc(
      "confirm_notification",
      {
        p_notification_id: notification.id,
      }
    );

    if (confirmError) {
      setError(`Potvrzení se nepodařilo uložit: ${confirmError.message}`);
      setBusyId(null);
      return;
    }

    setSuccess("Zpráva byla potvrzena.");
    await load();
    setBusyId(null);
  }

  function validateImage(file) {
    if (!file) return null;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Fotka musí být JPG, PNG nebo WebP.";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "Fotka může mít maximálně 5 MB.";
    }

    return null;
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

    const validationError = validateImage(file);

    if (validationError) {
      event.target.value = "";
      setError(validationError);
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function chooseEditImage(event) {
    setError("");

    const file = event.target.files?.[0] || null;

    if (!file) {
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      setEditImageFile(null);
      setEditImagePreview("");
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      event.target.value = "";
      setError(validationError);
      return;
    }

    if (editImagePreview) URL.revokeObjectURL(editImagePreview);

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
    setEditRemoveImage(false);
  }

  function removeSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  }

  function resetEditImage() {
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImageFile(null);
    setEditImagePreview("");
    setEditRemoveImage(false);
  }

  async function uploadFile(file) {
    if (!file) {
      return { publicUrl: null, path: null };
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "jpg";

    const path = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("notification-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
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

  function getStoragePathFromUrl(url) {
    if (!url) return null;

    const marker = "/notification-images/";
    const index = String(url).indexOf(marker);

    if (index === -1) return null;

    return decodeURIComponent(String(url).slice(index + marker.length));
  }

  async function removeUnusedImage(imageUrl) {
    if (!imageUrl) return;

    const { count, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("image_url", imageUrl);

    if (countError || Number(count || 0) > 0) {
      return;
    }

    const path = getStoragePathFromUrl(imageUrl);

    if (path) {
      await supabase.storage.from("notification-images").remove([path]);
    }
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
      const { publicUrl, path } = await uploadFile(imageFile);
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
        odesilatel_id: user.id,
        typ: notificationType || "OBECNÁ",
        zprava: cleanMessage,
        image_url: publicUrl,
        precteno: false,
        vyzaduje_potvrzeni: requiresConfirmation,
        potvrzeno: false,
        potvrzeno_at: null,
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
      setRequiresConfirmation(true);
      removeSelectedImage();

      await load();
    } catch (sendError) {
      setError(sendError?.message || "Notifikaci se nepodařilo odeslat.");
    } finally {
      setSending(false);
    }
  }

  function startEditGroup(group) {
    const notification = group.first;

    setError("");
    setSuccess("");

    resetEditImage();
    setEditingId(group.key);
    setEditType(notification.typ || "OBECNÁ");
    setEditMessage(notification.zprava || "");
    setEditRequiresConfirmation(
      notification.vyzaduje_potvrzeni !== false
    );
  }

  function cancelEdit() {
    resetEditImage();
    setEditingId(null);
    setEditType("OBECNÁ");
    setEditMessage("");
    setEditRequiresConfirmation(true);
  }

  async function saveEditGroup(group) {
    if (!manage) return;

    const cleanMessage = editMessage.trim();

    if (!cleanMessage) {
      setError("Zpráva nesmí být prázdná.");
      return;
    }

    setError("");
    setSuccess("");
    setBusyId(group.key);

    const ids = group.items.map((notification) => notification.id);
    const oldImageUrl = group.first.image_url || null;
    let newUploadedPath = null;

    try {
      let nextImageUrl = oldImageUrl;

      if (editImageFile) {
        const uploaded = await uploadFile(editImageFile);
        nextImageUrl = uploaded.publicUrl;
        newUploadedPath = uploaded.path;
      } else if (editRemoveImage) {
        nextImageUrl = null;
      }

      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          typ: editType || "OBECNÁ",
          zprava: cleanMessage,
          image_url: nextImageUrl,
          vyzaduje_potvrzeni: editRequiresConfirmation,
          potvrzeno: false,
          potvrzeno_at: null,
          precteno: false,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);

      if (updateError) {
        if (newUploadedPath) {
          await supabase.storage
            .from("notification-images")
            .remove([newUploadedPath]);
        }

        throw new Error(`Úprava notifikace selhala: ${updateError.message}`);
      }

      if (oldImageUrl && oldImageUrl !== nextImageUrl) {
        await removeUnusedImage(oldImageUrl);
      }

      setSuccess(
        `Rozesílka byla upravena pro ${ids.length} příjemců. Potvrzení byla vynulována.`
      );

      cancelEdit();
      await load();
    } catch (editError) {
      setError(editError?.message || "Notifikaci se nepodařilo upravit.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotificationGroup(group) {
    if (!manage) return;

    const count = group.items.length;

    const confirmed = window.confirm(
      `Opravdu chceš smazat celou tuto rozesílku pro ${count} ${
        count === 1 ? "příjemce" : "příjemců"
      }?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setBusyId(group.key);

    const ids = group.items.map((notification) => notification.id);
    const imageUrl = group.first.image_url || null;

    const { error: deleteError } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (deleteError) {
      setError(`Smazání notifikace selhalo: ${deleteError.message}`);
      setBusyId(null);
      return;
    }

    if (imageUrl) {
      await removeUnusedImage(imageUrl);
    }

    if (editingId === group.key) {
      cancelEdit();
    }

    setSuccess(`Celá rozesílka byla smazána (${count} příjemců).`);
    await load();
    setBusyId(null);
  }

  return (
    <div className="notifications-page">
      <div className="topbar">
        <div>
          <div className="notifications-eyebrow">CENTRUM OZNÁMENÍ</div>
          <h1>Notifikace</h1>
          <p>Zprávy, oznámení a potvrzení řidičů.</p>
        </div>

        <div className="notification-topbar-actions">
          {browserPermission !== "unsupported" && (
            <button
              type="button"
              className={
                browserPermission === "granted"
                  ? "secondary-button notification-browser-enabled"
                  : "primary-button"
              }
              onClick={enableBrowserNotifications}
              disabled={browserPermission === "granted"}
            >
              {browserPermission === "granted"
                ? "✓ Oznámení zapnutá"
                : browserPermission === "denied"
                ? "🔕 Oznámení zakázaná"
                : "🔔 Zapnout oznámení"}
            </button>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={markAll}
          >
            ✓ Označit vše jako přečtené
          </button>
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

      {manage && (
        <div className="notification-compose-card">
          <div className="notification-compose-heading">
            <div>
              <span className="notification-compose-icon">🔔</span>
              <div>
                <h2>Odeslat notifikaci</h2>
                <p>
                  Vyber příjemce, typ zprávy, text a případně fotografii.
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
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
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

            <label className="notification-confirm-switch">
              <input
                type="checkbox"
                checked={requiresConfirmation}
                onChange={(e) => setRequiresConfirmation(e.target.checked)}
              />
              <span className="notification-switch-ui" />
              <span>
                <strong>Vyžadovat potvrzení řidičem</strong>
                <small>
                  Řidič bude muset kliknout na „Potvrzuji převzetí“.
                </small>
              </span>
            </label>

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

      <div className="notification-section-heading">
        <div>
          <h2>Moje notifikace</h2>
          <p>Zprávy určené pro tebe.</p>
        </div>
      </div>

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
                    {notification.updated_at
                      ? ` · upraveno ${new Date(
                          notification.updated_at
                        ).toLocaleString("cs-CZ")}`
                      : ""}
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

              {isDriver && notification.vyzaduje_potvrzeni && (
                <div className="notification-confirm-area">
                  {notification.potvrzeno ? (
                    <div className="notification-confirmed">
                      ✓ Potvrzeno
                      {notification.potvrzeno_at
                        ? ` · ${new Date(
                            notification.potvrzeno_at
                          ).toLocaleString("cs-CZ")}`
                        : ""}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="notification-confirm-button"
                      disabled={busyId === notification.id}
                      onClick={() => confirmNotification(notification)}
                    >
                      {busyId === notification.id
                        ? "Ukládám…"
                        : "✓ Potvrzuji převzetí"}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {manage && (
        <>
          <div className="notification-section-heading notification-sent-heading">
            <div>
              <h2>Odeslané notifikace</h2>
              <p>
                Jedna rozesílka je teď vždy jedna karta. Úprava i smazání se
                provedou všem příjemcům najednou.
              </p>
            </div>
          </div>

          <div className="notifications-list">
            {sentGroups.length === 0 ? (
              <div className="notification-empty">
                <div>📨</div>
                <strong>Zatím nic odesláno</strong>
                <span>Ručně odeslané notifikace se zobrazí tady.</span>
              </div>
            ) : (
              sentGroups.map((group) => {
                const notification = group.first;
                const editing = editingId === group.key;
                const busy = busyId === group.key;
                const confirmation = getGroupConfirmation(group);

                return (
                  <article
                    className="notification-card notification-sent-card"
                    key={group.key}
                  >
                    <div className="notification-card-header">
                      <div>
                        <span className="notification-type">
                          {notification.typ || "OZNÁMENÍ"}
                        </span>

                        <small>
                          {notification.created_at
                            ? new Date(
                                notification.created_at
                              ).toLocaleString("cs-CZ")
                            : "—"}
                          {" · "}
                          {group.items.length}{" "}
                          {group.items.length === 1
                            ? "příjemce"
                            : "příjemců"}
                        </small>
                      </div>

                      <span
                        className={`notification-confirm-state ${
                          confirmation.confirmed ? "confirmed" : "waiting"
                        }`}
                      >
                        {confirmation.label}
                      </span>
                    </div>

                    <div className="notification-recipient-summary">
                      <strong>Příjemci:</strong>{" "}
                      {getGroupRecipientNames(group)}
                    </div>

                    {editing ? (
                      <div className="notification-edit-box">
                        <div className="notification-compose-grid">
                          <div className="notification-field">
                            <label>Typ</label>
                            <select
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                            >
                              {notificationTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="notification-field">
                            <label>Potvrzení</label>
                            <select
                              value={
                                editRequiresConfirmation ? "ANO" : "NE"
                              }
                              onChange={(e) =>
                                setEditRequiresConfirmation(
                                  e.target.value === "ANO"
                                )
                              }
                            >
                              <option value="ANO">
                                Vyžadovat potvrzení řidičem
                              </option>
                              <option value="NE">
                                Potvrzení nevyžadovat
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="notification-field">
                          <label>Zpráva</label>
                          <textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={4}
                          />
                        </div>

                        {notification.image_url &&
                          !editRemoveImage &&
                          !editImagePreview && (
                            <div className="notification-current-image">
                              <img
                                src={notification.image_url}
                                alt="Současná fotka"
                              />
                              <button
                                type="button"
                                className="notification-remove-image"
                                onClick={() => setEditRemoveImage(true)}
                              >
                                🗑️ Odebrat současnou fotku
                              </button>
                            </div>
                          )}

                        {editImagePreview && (
                          <div className="notification-current-image">
                            <img
                              src={editImagePreview}
                              alt="Nová fotka"
                            />
                            <button
                              type="button"
                              className="notification-remove-image"
                              onClick={resetEditImage}
                            >
                              ✕ Zrušit novou fotku
                            </button>
                          </div>
                        )}

                        <label className="notification-file-button notification-edit-file">
                          📷 Vybrat novou fotku
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={chooseEditImage}
                          />
                        </label>

                        <div className="notification-edit-actions">
                          <button
                            type="button"
                            className="primary-button"
                            disabled={busy}
                            onClick={() => saveEditGroup(group)}
                          >
                            {busy
                              ? "Ukládám…"
                              : `💾 Uložit všem (${group.items.length})`}
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busy}
                            onClick={cancelEdit}
                          >
                            Zrušit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="notification-message">
                          {notification.zprava}
                        </div>

                        {notification.image_url && (
                          <a
                            href={notification.image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="notification-image-link"
                          >
                            <img
                              src={notification.image_url}
                              alt="Fotka v notifikaci"
                              className="notification-image"
                              loading="lazy"
                            />
                          </a>
                        )}

                        <div className="notification-admin-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => startEditGroup(group)}
                          >
                            ✏️ Upravit celou rozesílku
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            disabled={busy}
                            onClick={() => deleteNotificationGroup(group)}
                          >
                            🗑️ Smazat celou rozesílku
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </>
      )}

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


function AdminCourses() {
  const { provozovny } = useProvozovny();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterProvozovna, setFilterProvozovna] = useState("");
  const [form, setForm] = useState({
    nazev: "",
    provozovna_id: "",
    typ_dne: "",
    typ_vozu: "",
    zacatek: "",
    konec: "",
  });

  async function loadCourses() {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("kurzy")
      .select("id, nazev, provozovna_id, aktivni, typ_dne, typ_vozu, zacatek, konec, created_at")
      .order("nazev", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setCourses([]);
    } else {
      setCourses(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function resetForm() {
    setEditing(null);
    setForm({ nazev: "", provozovna_id: "", typ_dne: "", typ_vozu: "", zacatek: "", konec: "" });
  }

  async function saveCourse(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const name = form.nazev.trim();

    if (!name || !form.provozovna_id) {
      setError("Vyplň název kurzu a provozovnu.");
      setSaving(false);
      return;
    }

    const payload = {
      nazev: name,
      provozovna_id: Number(form.provozovna_id),
      aktivni: true,
      typ_dne: form.typ_dne || null,
      typ_vozu: form.typ_vozu || null,
      zacatek: form.zacatek || null,
      konec: form.konec || null,
    };

    const result = editing
      ? await supabase
          .from("kurzy")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("kurzy").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(editing ? "Kurz byl upraven." : "Kurz byl přidán.");
    resetForm();
    await loadCourses();
    setSaving(false);
  }

  async function toggleCourse(course) {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("kurzy")
      .update({ aktivni: !course.aktivni })
      .eq("id", course.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(course.aktivni ? "Kurz byl deaktivován." : "Kurz byl aktivován.");
    await loadCourses();
  }

  async function deleteCourse(course) {
    if (
      !window.confirm(
        `Opravdu chceš smazat kurz ${course.nazev}?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("kurzy")
      .delete()
      .eq("id", course.id);

    if (deleteError) {
      setError(
        deleteError.message.includes("foreign key")
          ? "Kurz už je použitý ve výpravách. Místo smazání ho deaktivuj."
          : deleteError.message
      );
      return;
    }

    setSuccess("Kurz byl smazán.");
    await loadCourses();
  }

  function getProvozovnaName(id) {
    return (
      provozovny.find(
        (provozovna) => String(provozovna.id) === String(id)
      )?.nazev || "-"
    );
  }

  const query = search.trim().toLowerCase();

  const filtered = courses.filter((course) => {
    if (
      filterProvozovna &&
      String(course.provozovna_id) !== String(filterProvozovna)
    ) {
      return false;
    }

    if (!query) return true;

    return `${course.nazev} ${getProvozovnaName(
      course.provozovna_id
    )}`
      .toLowerCase()
      .includes(query);
  });

  const filteredWorkdayCourses = filtered.filter(
    (course) => course.typ_dne === "PD"
  );

  const filteredWeekendCourses = filtered.filter(
    (course) => course.typ_dne === "VIKEND"
  );

  const filteredSundayCourses = filtered.filter(
    (course) => course.typ_dne === "NE"
  );

  const filteredDailyCourses = filtered.filter(
    (course) => course.typ_dne === "DENNE"
  );

  const filteredOtherCourses = filtered.filter(
    (course) => !course.typ_dne
  );

  function renderCourseItem(course) {
    return (
      <div
        className={`course-admin-item ${
          course.aktivni ? "" : "inactive"
        }`}
        key={course.id}
      >
        <div>
          <strong>{course.nazev}</strong>
          <span>
            {getProvozovnaName(course.provozovna_id)}
            {course.typ_dne
              ? ` · ${getCourseDayLabel(course.typ_dne)}`
              : ""}
            {course.typ_vozu
              ? ` · ${course.typ_vozu === "SOLO" ? "Sólo" : "Kloub"}`
              : ""}
            {course.zacatek || course.konec
              ? ` · ${course.zacatek ? String(course.zacatek).slice(0, 5) : "—"}–${course.konec ? String(course.konec).slice(0, 5) : "—"}`
              : ""}
          </span>
        </div>

        <span
          className={`course-active-badge ${
            course.aktivni ? "active" : "inactive"
          }`}
        >
          {course.aktivni ? "AKTIVNÍ" : "NEAKTIVNÍ"}
        </span>

        <div className="course-admin-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setEditing(course);
              setForm({
                nazev: course.nazev,
                provozovna_id:
                  course.provozovna_id || "",
                typ_dne: course.typ_dne || "",
                typ_vozu: course.typ_vozu || "",
                zacatek: course.zacatek
                  ? String(course.zacatek).slice(0, 5)
                  : "",
                konec: course.konec
                  ? String(course.konec).slice(0, 5)
                  : "",
              });
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            ✏️ Upravit
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => toggleCourse(course)}
          >
            {course.aktivni
              ? "⏸ Deaktivovat"
              : "▶ Aktivovat"}
          </button>

          <button
            type="button"
            className="delete-button"
            onClick={() => deleteCourse(course)}
          >
            🗑️ Smazat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Kurzy</h1>
          <p>Číselník pořadí podle provozoven</p>
        </div>

        <div className="profile-badge">
          {courses.length} KURZŮ
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

      <div className="course-admin-layout">
        <div className="panel">
          <h2>{editing ? "✏️ Upravit pořadí" : "➕ Přidat pořadí"}</h2>

          <form onSubmit={saveCourse}>
            <div className="form-grid">
              <div>
                <label>Název pořadí</label>
                <input
                  value={form.nazev}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nazev: e.target.value,
                    })
                  }
                  placeholder="Např. MHDCL1, 53.01, 349101..."
                  required
                />
              </div>

              <div>
                <label>Provozovna</label>
                <select
                  value={form.provozovna_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      provozovna_id: e.target.value,
                    })
                  }
                  required
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

              <div>
                <label>Typ dne</label>
                <select
                  value={form.typ_dne}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      typ_dne: e.target.value,
                    })
                  }
                >
                  <option value="">Bez omezení dne</option>
                  <option value="PD">Pracovní den (Po–Pá)</option>
                  <option value="VIKEND">Víkend (So–Ne)</option>
                  <option value="NE">Pouze neděle</option>
                  <option value="DENNE">Každý den (Po–Ne)</option>
                </select>
              </div>

              <div>
                <label>Typ vozu</label>
                <select
                  value={form.typ_vozu}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      typ_vozu: e.target.value,
                    })
                  }
                >
                  <option value="">Bez omezení</option>
                  <option value="SOLO">Sólo</option>
                  <option value="KLOUB">Kloub</option>
                </select>
              </div>

              <div>
                <label>Začátek</label>
                <input
                  type="time"
                  value={form.zacatek || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      zacatek: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Konec</label>
                <input
                  type="time"
                  value={form.konec || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      konec: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-buttons">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Ukládám..."
                  : editing
                  ? "💾 Uložit změny"
                  : "➕ Přidat kurz"}
              </button>

              {editing && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Zrušit úpravy
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="users-toolbar">
            <div>
              <h2>Seznam kurzů</h2>
              <p className="muted">
                Pořadí se ve Výpravách zobrazí pouze u své provozovny.
              </p>
            </div>
          </div>

          <div className="course-admin-filters">
            <input
              className="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔎 Hledat pořadí..."
            />

            <select
              value={filterProvozovna}
              onChange={(e) =>
                setFilterProvozovna(e.target.value)
              }
            >
              <option value="">Všechny provozovny</option>
              {provozovny.map((provozovna) => (
                <option
                  key={provozovna.id}
                  value={provozovna.id}
                >
                  {provozovna.nazev}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="empty">Načítání kurzů...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Žádné kurzy.</div>
          ) : (
            <div className="course-day-sections">
              {filteredWorkdayCourses.length > 0 && (
                <section className="course-day-section workday">
                  <div className="course-day-section-title">
                    <div>
                      <strong>Pracovní den</strong>
                      <span>{filteredWorkdayCourses.length} kurzů</span>
                    </div>
                    <span className="course-day-chip">PD</span>
                  </div>

                  <div className="course-admin-list">
                    {filteredWorkdayCourses.map(renderCourseItem)}
                  </div>
                </section>
              )}

              {filteredWeekendCourses.length > 0 && (
                <section className="course-day-section weekend">
                  <div className="course-day-section-title">
                    <div>
                      <strong>Víkend</strong>
                      <span>{filteredWeekendCourses.length} kurzů</span>
                    </div>
                    <span className="course-day-chip">VÍKEND</span>
                  </div>

                  <div className="course-admin-list">
                    {filteredWeekendCourses.map(renderCourseItem)}
                  </div>
                </section>
              )}

              {filteredSundayCourses.length > 0 && (
                <section className="course-day-section sunday">
                  <div className="course-day-section-title">
                    <div>
                      <strong>Neděle</strong>
                      <span>{filteredSundayCourses.length} kurzů</span>
                    </div>
                    <span className="course-day-chip">NE</span>
                  </div>

                  <div className="course-admin-list">
                    {filteredSundayCourses.map(renderCourseItem)}
                  </div>
                </section>
              )}

              {filteredDailyCourses.length > 0 && (
                <section className="course-day-section daily">
                  <div className="course-day-section-title">
                    <div>
                      <strong>Každý den</strong>
                      <span>{filteredDailyCourses.length} kurzů</span>
                    </div>
                    <span className="course-day-chip">PO–NE</span>
                  </div>

                  <div className="course-admin-list">
                    {filteredDailyCourses.map(renderCourseItem)}
                  </div>
                </section>
              )}

              {filteredOtherCourses.length > 0 && (
                <section className="course-day-section">
                  <div className="course-day-section-title">
                    <div>
                      <strong>Bez omezení dne</strong>
                      <span>{filteredOtherCourses.length} kurzů</span>
                    </div>
                  </div>

                  <div className="course-admin-list">
                    {filteredOtherCourses.map(renderCourseItem)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




function Departures({ role, onOpenVehicle }) {
  const manage = canManageVehicles(role);
  const { provozovny } = useProvozovny();

  const now = new Date();

  const [selectedProvozovna, setSelectedProvozovna] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [courseDetail, setCourseDetail] = useState(null);
  const [courseDetailRows, setCourseDetailRows] = useState([]);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [courseDetailError, setCourseDetailError] = useState("");
  const [cellForm, setCellForm] = useState({
    kurz_ids: [],
    poznamka: "",
  });

  useEffect(() => {
    if (selectedProvozovna) return;

    function normalizeBranchName(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    }

    const allowed = provozovny.filter((provozovna) => {
      const name = normalizeBranchName(provozovna.nazev);

      return (
        name === "400" ||
        name === "breclavsko" ||
        name.startsWith("brno") ||
        name === "bukovec" ||
        name.includes("wroclaw")
      );
    });

    const preferred =
      allowed.find(
        (provozovna) =>
          normalizeBranchName(provozovna.nazev) === "400"
      ) || allowed[0];

    if (preferred) {
      setSelectedProvozovna(String(preferred.id));
    }
  }, [provozovny, selectedProvozovna]);

  async function loadReferences() {
    setError("");

    const [vehicleResult, courseResult] = await Promise.all([
      supabase
        .from("vozy")
        .select("id,cislo,vyrobce,typ,provozovna_id")
        .order("cislo", { ascending: true }),

      supabase
        .from("kurzy")
        .select("id,nazev,provozovna_id,aktivni,typ_dne,typ_vozu,zacatek,konec")
        .order("nazev", { ascending: true }),
    ]);

    if (vehicleResult.error) {
      setError(vehicleResult.error.message);
      setVehicles([]);
    } else {
      setVehicles(vehicleResult.data || []);
    }

    if (courseResult.error) {
      setError((old) => old || courseResult.error.message);
      setCourses([]);
    } else {
      setCourses(courseResult.data || []);
    }
  }

  async function loadMonth() {
    if (!selectedProvozovna || !selectedMonth) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [yearText, monthText] = selectedMonth.split("-");
    const year = Number(yearText);
    const month = Number(monthText);

    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;

    const { data, error: loadError } = await supabase
      .from("vypravy")
      .select("*")
      .eq("provozovna_id", Number(selectedProvozovna))
      .gte("datum", from)
      .lte("datum", to)
      .order("datum", { ascending: true });

    if (loadError) {
      setError(loadError.message);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReferences();
  }, []);

  useEffect(() => {
    loadMonth();
  }, [selectedProvozovna, selectedMonth]);

  const [yearText, monthText] = selectedMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days = Array.from(
    { length: daysInMonth },
    (_, index) => index + 1
  );

  const selectedProvozovnaRow =
    provozovny.find(
      (item) => String(item.id) === String(selectedProvozovna)
    ) || null;

  function normalizeBranchName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/Ł/g, "l")
      .toLowerCase()
      .trim();
  }

  const departureProvozovny = provozovny.filter((provozovna) => {
    const name = normalizeBranchName(provozovna.nazev);

    return (
      name === "400" ||
      name === "breclavsko" ||
      name.startsWith("brno") ||
      name === "bukovec" ||
      name.includes("wroclaw")
    );
  });

  const visibleVehicles = vehicles.filter(
    (vehicle) =>
      String(vehicle.provozovna_id) === String(selectedProvozovna)
  );

  const visibleCourses = courses.filter(
    (course) =>
      course.aktivni &&
      String(course.provozovna_id) === String(selectedProvozovna)
  );

  function coursesForDay(day) {
    const date = new Date(year, month - 1, day);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    return visibleCourses.filter((course) => {
      if (!course.typ_dne) return true;
      if (course.typ_dne === "DENNE") return true;
      if (course.typ_dne === "NE") return weekday === 0;
      if (course.typ_dne === "VIKEND") return isWeekend;
      if (course.typ_dne === "PD") return !isWeekend;
      return true;
    });
  }

  function isoDate(day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  }

  function getEntries(vehicleId, day) {
    const date = isoDate(day);

    return rows.filter(
      (row) =>
        String(row.vuz_id) === String(vehicleId) &&
        row.datum === date
    );
  }

  function getCourse(row) {
    if (!row) return null;

    return courses.find(
      (course) => String(course.id) === String(row.kurz_id)
    );
  }

  function dayInfo(day) {
    const date = new Date(year, month - 1, day);
    const weekdayIndex = date.getDay();

    const names = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    const today = new Date();

    return {
      name: names[weekdayIndex],
      weekend: weekdayIndex === 0 || weekdayIndex === 6,
      today:
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate(),
    };
  }

  function openEditor(vehicle, day) {
    if (!manage) return;

    const entries = getEntries(vehicle.id, day);

    setError("");
    setSuccess("");

    setEditor({
      vehicle,
      day,
      date: isoDate(day),
      rows: entries,
      courses: coursesForDay(day),
    });

    setCellForm({
      kurz_ids: entries
        .filter((row) => row.kurz_id)
        .map((row) => String(row.kurz_id)),
      poznamka: entries[0]?.poznamka || "",
    });
  }

  function closeEditor() {
    setEditor(null);
    setCellForm({
      kurz_ids: [],
      poznamka: "",
    });
  }

  function toggleCourse(courseId) {
    const id = String(courseId);

    setCellForm((old) => ({
      ...old,
      kurz_ids: old.kurz_ids.includes(id)
        ? old.kurz_ids.filter((item) => item !== id)
        : [...old.kurz_ids, id],
    }));
  }

  async function openCourseDetail(course) {
    setCourseDetail(course);
    setCourseDetailRows([]);
    setCourseDetailError("");
    setCourseDetailLoading(true);

    const { data, error: detailError } = await supabase
      .from("kurz_spoje")
      .select("id,poradi,spoj,odjezd,prijezd,odkud,kam")
      .eq("kurz_id", course.id)
      .order("poradi", { ascending: true });

    if (detailError) {
      setCourseDetailError(detailError.message);
      setCourseDetailRows([]);
    } else {
      setCourseDetailRows(data || []);
    }

    setCourseDetailLoading(false);
  }

  function closeCourseDetail() {
    setCourseDetail(null);
    setCourseDetailRows([]);
    setCourseDetailError("");
    setCourseDetailLoading(false);
  }

  async function saveEntry(e) {
    e.preventDefault();

    if (!editor || cellForm.kurz_ids.length === 0) {
      setError("Vyber alespoň jednu výpravu / pořadí.");
      return;
    }

    const selectedCourses = cellForm.kurz_ids
      .map((id) =>
        courses.find(
          (item) => String(item.id) === String(id)
        )
      )
      .filter(Boolean);

    if (selectedCourses.length !== cellForm.kurz_ids.length) {
      setError("Některá vybraná výprava nebyla nalezena.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const existingRows = editor.rows || [];
    const desiredIds = new Set(
      selectedCourses.map((course) => String(course.id))
    );

    const rowsToDelete = existingRows.filter(
      (row) =>
        !row.kurz_id ||
        !desiredIds.has(String(row.kurz_id))
    );

    const existingCourseIds = new Set(
      existingRows
        .filter((row) => row.kurz_id)
        .map((row) => String(row.kurz_id))
    );

    const coursesToInsert = selectedCourses.filter(
      (course) => !existingCourseIds.has(String(course.id))
    );

    const retainedRows = existingRows.filter(
      (row) =>
        row.kurz_id &&
        desiredIds.has(String(row.kurz_id))
    );

    const note = cellForm.poznamka.trim() || null;

    if (rowsToDelete.length > 0) {
      const deleteResult = await supabase
        .from("vypravy")
        .delete()
        .in(
          "id",
          rowsToDelete.map((row) => row.id)
        );

      if (deleteResult.error) {
        setError(deleteResult.error.message);
        setSaving(false);
        return;
      }
    }

    if (retainedRows.length > 0) {
      const updateResult = await supabase
        .from("vypravy")
        .update({ poznamka: note })
        .in(
          "id",
          retainedRows.map((row) => row.id)
        );

      if (updateResult.error) {
        setError(updateResult.error.message);
        setSaving(false);
        return;
      }
    }

    if (coursesToInsert.length > 0) {
      const payload = coursesToInsert.map((course) => ({
        datum: editor.date,
        provozovna_id: Number(selectedProvozovna),
        vuz_id: Number(editor.vehicle.id),
        kurz_id: Number(course.id),
        linka: course.nazev,
        ridic_id: null,
        poznamka: note,
      }));

      const insertResult = await supabase
        .from("vypravy")
        .insert(payload);

      if (insertResult.error) {
        setError(insertResult.error.message);
        setSaving(false);
        return;
      }
    }

    setSuccess(
      `Vůz ${editor.vehicle.cislo} má pro ${editor.date} přiřazeno ${selectedCourses.length} ${
        selectedCourses.length === 1 ? "pořadí" : "pořadí"
      }.`
    );

    closeEditor();
    await loadMonth();
    setSaving(false);
  }

  async function deleteEntry() {
    const existingRows = editor?.rows || [];
    if (existingRows.length === 0) return;

    if (
      !window.confirm(
        `Opravdu chceš odebrat všechny výpravy vozu ${editor.vehicle.cislo} dne ${editor.date}?`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("vypravy")
      .delete()
      .in(
        "id",
        existingRows.map((row) => row.id)
      );

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    setSuccess("Všechny výpravy byly z vozu pro tento den odebrány.");
    closeEditor();
    await loadMonth();
    setSaving(false);
  }

  function changeMonth(offset) {
    const date = new Date(year, month - 1 + offset, 1);

    setSelectedMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );
  }

  function getDepartureCourseGroups(courseRows) {
    const hasVehicleType = courseRows.some((course) => course.typ_vozu);

    if (hasVehicleType) {
      const typeGroups = [
        {
          key: "solo",
          title: "Sólo",
          courses: courseRows.filter((course) => course.typ_vozu === "SOLO"),
        },
        {
          key: "kloub",
          title: "Kloub",
          courses: courseRows.filter((course) => course.typ_vozu === "KLOUB"),
        },
        {
          key: "ostatni",
          title: "Ostatní",
          courses: courseRows.filter((course) => !course.typ_vozu),
        },
      ];

      return typeGroups
        .map((group) => ({
          ...group,
          courses: group.courses.sort((a, b) =>
            String(a.nazev).localeCompare(String(b.nazev), "cs", {
              numeric: true,
              sensitivity: "base",
            })
          ),
        }))
        .filter((group) => group.courses.length > 0);
    }

    const groups = [
      {
        key: "liberec",
        title: "ČSAD Liberec",
        test: (name) =>
          ["205.01", "206.01", "210.11", "210.21", "211.01", "304.01", "305.01", "306.01", "309.01", "310.01", "311.01", "205.67", "206.07", "303.07", "317.67"].includes(name),
      },
      {
        key: "mhdcl",
        title: "MHDCL",
        test: (name) => /^MHDCL/i.test(name),
      },
      {
        key: "ceska-lipa",
        title: "ČSAD Česká Lípa",
        test: (name) =>
          ["51.01", "52.01", "53.01", "54.01", "55.01", "56.01", "57.01", "58.01", "59.01", "51.67", "52.67", "53.67", "54.67", "55.67", "56.67", "57.67", "58.67", "59.67"].includes(name),
      },
      {
        key: "stredni-cechy",
        title: "Střední Čechy",
        test: (name) => /^349\d+$/i.test(name),
      },
      {
        key: "smluvni",
        title: "Smluvní doprava",
        test: (name) => /^S1\./i.test(name),
      },
      {
        key: "nad",
        title: "NAD",
        test: (name) => /^(XR|XS|XL)/i.test(name),
      },
    ];

    const result = groups.map((group) => ({
      ...group,
      courses: courseRows
        .filter((course) => group.test(String(course.nazev || "").trim()))
        .sort((a, b) =>
          String(a.nazev).localeCompare(String(b.nazev), "cs", {
            numeric: true,
            sensitivity: "base",
          })
        ),
    }));

    const usedIds = new Set(
      result.flatMap((group) => group.courses.map((course) => String(course.id)))
    );

    const otherCourses = courseRows
      .filter((course) => !usedIds.has(String(course.id)))
      .sort((a, b) =>
        String(a.nazev).localeCompare(String(b.nazev), "cs", {
          numeric: true,
          sensitivity: "base",
        })
      );

    if (otherCourses.length > 0) {
      result.push({
        key: "ostatni",
        title: "Ostatní",
        courses: otherCourses,
      });
    }

    return result.filter((group) => group.courses.length > 0);
  }

  const departureCourseGroups = getDepartureCourseGroups(
    editor?.courses || visibleCourses
  );

  function getMissingCoursesForDay(day) {
    const date = isoDate(day);

    const assignedCourseIds = new Set(
      rows
        .filter(
          (row) =>
            row.datum === date &&
            row.kurz_id
        )
        .map((row) => String(row.kurz_id))
    );

    return visibleCourses.filter(
      (course) => !assignedCourseIds.has(String(course.id))
    );
  }

  function getAssignedCountForDay(day) {
    const date = isoDate(day);

    return rows.filter(
      (row) =>
        row.datum === date &&
        row.kurz_id
    ).length;
  }

  return (
    <div className="departures-page">
      <div className="topbar">
        <div>
          <div className="departures-eyebrow">
            VÝPRAVOVÝ PLÁN
          </div>
          <h1>Výpravy</h1>
          <p>
            Vozy provozovny a jejich výpravy podle jednotlivých dnů
          </p>
        </div>

        <div className="profile-badge">
          {visibleVehicles.length} VOZŮ
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

      <div className="departures-toolbar panel">
        <div className="departures-branches departures-tabs">
          {departureProvozovny.map((provozovna) => (
            <button
              type="button"
              key={provozovna.id}
              className={
                String(provozovna.id) === String(selectedProvozovna)
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedProvozovna(String(provozovna.id))
              }
            >
              {provozovna.nazev}
            </button>
          ))}
        </div>

        <div className="departures-month-control">
          <button
            type="button"
            className="secondary-button"
            onClick={() => changeMonth(-1)}
          >
            ‹
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <button
            type="button"
            className="secondary-button"
            onClick={() => changeMonth(1)}
          >
            ›
          </button>
        </div>
      </div>

      {selectedProvozovnaRow && (
        <div className="departures-selected-branch">
          <div>
            <span>PROVOZOVNA</span>
            <strong>{selectedProvozovnaRow.nazev}</strong>
          </div>

          <div>
            <span>VOZY</span>
            <strong>{visibleVehicles.length}</strong>
          </div>

          <div>
            <span>VÝPRAVY / POŘADÍ</span>
            <strong>{visibleCourses.length}</strong>
          </div>
        </div>
      )}

      {!selectedProvozovna ? (
        <div className="empty">Vyber provozovnu.</div>
      ) : loading ? (
        <div className="empty">Načítání výprav...</div>
      ) : visibleVehicles.length === 0 ? (
        <div className="empty">
          Provozovna{" "}
          <strong>{selectedProvozovnaRow?.nazev}</strong>{" "}
          zatím nemá přiřazené žádné vozy. Přiřaď je v
          Administraci vozů.
        </div>
      ) : (
        <>
          <div className="departures-mobile-hint">
            ← Posuň tabulku do stran • číslo vozu zůstává vlevo
          </div>

          <div className="departures-table-wrap">
          <table className="departures-month-table">
            <thead>
              <tr>
                <th className="departures-vehicle-column">
                  Vůz
                </th>

                {days.map((day) => {
                  const info = dayInfo(day);

                  return (
                    <th
                      key={day}
                      className={[
                        info.weekend ? "weekend" : "",
                        info.today ? "today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span>{info.name}</span>
                      <strong>{day}</strong>

                      {getMissingCoursesForDay(day).length > 0 && (
                        <em
                          className="departure-missing-badge"
                          title={`${getMissingCoursesForDay(day).length} nevypravených pořadí`}
                        >
                          !{getMissingCoursesForDay(day).length}
                        </em>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visibleVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="departures-vehicle-column">
                    <button
                      type="button"
                      className="departure-vehicle-link"
                      onClick={() => {
                        if (onOpenVehicle) {
                          onOpenVehicle(vehicle.id);
                        }
                      }}
                      title={`Otevřít detail vozu ${vehicle.cislo}`}
                    >
                      <strong>{vehicle.cislo}</strong>
                      <small>
                        {vehicle.vyrobce || ""} {vehicle.typ || ""}
                      </small>
                    </button>
                  </td>

                  {days.map((day) => {
                    const info = dayInfo(day);
                    const entries = getEntries(vehicle.id, day);
                    const assigned = entries.map((row) => ({
                      row,
                      course: getCourse(row),
                    }));

                    return (
                      <td
                        key={day}
                        className={[
                          "departure-cell",
                          info.weekend ? "weekend" : "",
                          info.today ? "today" : "",
                          entries.length > 0 ? "filled" : "",
                          entries.length > 1 ? "multi" : "",
                          manage ? "editable" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => openEditor(vehicle, day)}
                        title={
                          entries.length > 0
                            ? assigned
                                .map(
                                  ({ row, course }) =>
                                    course?.nazev ||
                                    row.linka ||
                                    "Výprava"
                                )
                                .join(", ")
                            : manage
                            ? "Klikni pro přiřazení jedné nebo více výprav"
                            : ""
                        }
                      >
                        {entries.length > 0 ? (
                          <div className="departure-cell-course-list">
                            {assigned.map(({ row, course }) =>
                              course ? (
                                <button
                                  type="button"
                                  className="departure-cell-course-tag departure-cell-course-link"
                                  key={row.id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openCourseDetail(course);
                                  }}
                                  title={`Zobrazit spoje turnusu ${course.nazev}`}
                                >
                                  <span>
                                    {course.nazev}
                                  </span>
                                  <small>Spoje</small>
                                </button>
                              ) : (
                                <span
                                  className="departure-cell-course-tag"
                                  key={row.id}
                                >
                                  {row.linka || "-"}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="departure-cell-empty">
                            {manage ? "+" : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="departure-missing-row">
                <td className="departures-vehicle-column departure-missing-label">
                  <strong>Nevypraveno</strong>
                  <small>Chybějící pořadí</small>
                </td>

                {days.map((day) => {
                  const missing = getMissingCoursesForDay(day);

                  return (
                    <td
                      key={`missing-${day}`}
                      className={[
                        "departure-missing-cell",
                        missing.length > 0 ? "has-missing" : "all-dispatched",
                      ].join(" ")}
                    >
                      {missing.length === 0 ? (
                        <span className="departure-all-ok">✓</span>
                      ) : (
                        <div className="departure-missing-list">
                          <strong>{missing.length}</strong>
                          <div className="departure-missing-names">
                            {missing.map((course) => (
                              <span key={course.id}>
                                {course.nazev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          </div>
        </>
      )}

      {selectedProvozovna &&
        visibleCourses.length > 0 && (
          <div className="departure-missing-summary">
            <div>
              <strong>Kontrola vypravení</strong>
              <span>
                Červené označení znamená, že v daný den není některé pořadí přiřazené žádnému vozu.
              </span>
            </div>

            <div className="departure-missing-summary-stats">
              {days
                .filter((day) => getMissingCoursesForDay(day).length > 0)
                .slice(0, 7)
                .map((day) => (
                  <span key={day}>
                    {day}. den: {getMissingCoursesForDay(day).length}
                  </span>
                ))}
            </div>
          </div>
        )}

      {manage &&
        selectedProvozovna &&
        visibleCourses.length === 0 && (
          <div className="departures-warning">
            Pro provozovnu{" "}
            <strong>{selectedProvozovnaRow?.nazev}</strong>{" "}
            nejsou zatím přidané žádné výpravy / pořadí.
            Přidej je v Administraci → Kurzy.
          </div>
        )}

      {editor && (
        <div
          className="departure-modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeEditor();
            }
          }}
        >
          <div className="departure-modal">
            <div className="departure-modal-head">
              <div>
                <span>
                  {selectedProvozovnaRow?.nazev}
                </span>
                <h2>Vůz {editor.vehicle.cislo}</h2>
                <p>
                  {new Date(
                    `${editor.date}T00:00:00`
                  ).toLocaleDateString("cs-CZ", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <button
                type="button"
                className="departure-modal-close"
                onClick={closeEditor}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveEntry}>
              <div className="notification-field">
                <label>Provozovna</label>
                <input
                  value={
                    selectedProvozovnaRow?.nazev || ""
                  }
                  disabled
                />
              </div>

              <div className="notification-field">
                <label>Vůz</label>
                <input
                  value={`${editor.vehicle.cislo}${
                    editor.vehicle.vyrobce
                      ? ` – ${editor.vehicle.vyrobce}`
                      : ""
                  }${
                    editor.vehicle.typ
                      ? ` ${editor.vehicle.typ}`
                      : ""
                  }`}
                  disabled
                />
              </div>

              <div className="departure-day-type-banner">
                <span>Typ dne</span>
                <strong>
                  {(() => {
                    const d = new Date(`${editor.date}T00:00:00`);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return isWeekend ? "Víkend" : "Pracovní den";
                  })()}
                </strong>
              </div>

              <div className="notification-field">
                <label>Výpravy / pořadí – můžeš vybrat více</label>

                <div className="departure-multi-summary">
                  <strong>{cellForm.kurz_ids.length}</strong>
                  <span>
                    {cellForm.kurz_ids.length === 1
                      ? "vybrané pořadí"
                      : "vybraných pořadí"}
                  </span>
                </div>

                {(editor.courses || []).length === 0 ? (
                  <div className="departure-course-empty">
                    Pro tuto provozovnu zatím nejsou přidané žádné kurzy.
                  </div>
                ) : (
                  <div className="departure-course-groups">
                    {departureCourseGroups.map((group) => (
                      <div
                        className="departure-course-group"
                        key={group.key}
                      >
                        <div className="departure-course-group-title">
                          {group.title}
                        </div>

                        <div className="departure-course-picker">
                          {group.courses.map((course) => {
                            const selected = cellForm.kurz_ids.includes(
                              String(course.id)
                            );

                            return (
                              <div
                                key={course.id}
                                className={`departure-course-card ${
                                  selected ? "active" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  className="departure-course-select"
                                  onClick={() => toggleCourse(course.id)}
                                  aria-label={
                                    selected
                                      ? `Odebrat ${course.nazev} z výběru`
                                      : `Přidat ${course.nazev} do výběru`
                                  }
                                  title={
                                    selected
                                      ? "Odebrat z vozu"
                                      : "Přidat na vůz"
                                  }
                                >
                                  {selected ? "✓" : "+"}
                                </button>

                                <button
                                  type="button"
                                  className="departure-course-detail-button"
                                  onClick={() => openCourseDetail(course)}
                                >
                                  <span className="departure-course-detail-copy">
                                    <strong>{course.nazev}</strong>
                                    {course.typ_dne && (
                                      <span className="departure-course-day">
                                        {getCourseDayLabel(course.typ_dne)}
                                      </span>
                                    )}
                                    {(course.zacatek || course.konec) && (
                                      <small>
                                        {course.zacatek
                                          ? String(course.zacatek).slice(0, 5)
                                          : "—"}
                                        {" – "}
                                        {course.konec
                                          ? String(course.konec).slice(0, 5)
                                          : "—"}
                                      </small>
                                    )}
                                  </span>

                                  <span className="departure-course-detail-link">
                                    Spoje →
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notification-field">
                <label>Poznámka</label>
                <textarea
                  rows={4}
                  value={cellForm.poznamka}
                  onChange={(e) =>
                    setCellForm({
                      ...cellForm,
                      poznamka: e.target.value,
                    })
                  }
                  placeholder="Volitelná poznámka..."
                />
              </div>

              <div className="departure-modal-actions">
                {(editor.rows || []).length > 0 && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={deleteEntry}
                    disabled={saving}
                  >
                    🗑️ Odebrat všechny
                  </button>
                )}

                <div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeEditor}
                    disabled={saving}
                  >
                    Zrušit
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving ||
                      (editor.courses || []).length === 0 ||
                      cellForm.kurz_ids.length === 0
                    }
                  >
                    {saving
                      ? "Ukládám..."
                      : "💾 Uložit výpravy"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {courseDetail && (
        <div
          className="modal-backdrop turnus-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCourseDetail();
            }
          }}
        >
          <div className="turnus-detail-modal">
            <div className="turnus-detail-head">
              <div>
                <span className="turnus-detail-kicker">
                  SPOJE TURNUSE
                </span>
                <h2>{courseDetail.nazev}</h2>
                <p>
                  {courseDetail.typ_dne
                    ? getCourseDayLabel(courseDetail.typ_dne)
                    : "Bez omezení dne"}
                  {" · "}
                  {courseDetail.zacatek
                    ? String(courseDetail.zacatek).slice(0, 5)
                    : "—"}
                  {" – "}
                  {courseDetail.konec
                    ? String(courseDetail.konec).slice(0, 5)
                    : "—"}
                </p>
              </div>

              <button
                type="button"
                className="stk-dashboard-modal-close"
                onClick={closeCourseDetail}
                aria-label="Zavřít detail turnusu"
              >
                ✕
              </button>
            </div>

            <div className="turnus-detail-summary">
              <div>
                <span>Turnus</span>
                <strong>{courseDetail.nazev}</strong>
              </div>
              <div>
                <span>Začátek</span>
                <strong>
                  {courseDetail.zacatek
                    ? String(courseDetail.zacatek).slice(0, 5)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Konec</span>
                <strong>
                  {courseDetail.konec
                    ? String(courseDetail.konec).slice(0, 5)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Spojů</span>
                <strong>{courseDetailRows.length}</strong>
              </div>
            </div>

            {courseDetailError && (
              <div className="error-box">{courseDetailError}</div>
            )}

            {courseDetailLoading ? (
              <div className="turnus-detail-loading">Načítám spoje...</div>
            ) : courseDetailRows.length === 0 ? (
              <div className="turnus-detail-empty">
                Pro tento turnus zatím nejsou uložené žádné spoje.
              </div>
            ) : (
              <div className="turnus-spoje-wrap">
                <table className="turnus-spoje-table">
                  <thead>
                    <tr>
                      <th>Spoj</th>
                      <th>Odjezd</th>
                      <th>Příjezd</th>
                      <th>Odkud</th>
                      <th>Kam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseDetailRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.spoj}</strong>
                        </td>
                        <td className="turnus-time">
                          {String(row.odjezd || "").slice(0, 5)}
                        </td>
                        <td className="turnus-time">
                          {String(row.prijezd || "").slice(0, 5)}
                        </td>
                        <td>{row.odkud || "—"}</td>
                        <td>{row.kam || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="turnus-detail-actions">
              {manage && editor && (
                <button
                  type="button"
                  className={`primary-button ${
                    cellForm.kurz_ids.includes(String(courseDetail.id))
                      ? "turnus-selected-button"
                      : ""
                  }`}
                  onClick={() => toggleCourse(courseDetail.id)}
                >
                  {cellForm.kurz_ids.includes(String(courseDetail.id))
                    ? "✓ Turnus je vybraný – odebrat"
                    : "+ Přidat turnus na vůz"}
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={closeCourseDetail}
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditLog() {
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAudit() {
    setLoading(true);
    setError("");

    const [auditResult, profileResult] = await Promise.all([
      supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),

      supabase
        .from("profiles")
        .select("id,jmeno"),
    ]);

    if (auditResult.error) {
      console.error("AUDIT LOG ERROR:", auditResult.error);
      setError(auditResult.error.message);
      setRows([]);
    } else {
      setRows(auditResult.data || []);
    }

    if (!profileResult.error) {
      setProfiles(profileResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAudit();
  }, []);

  function actorName(id) {
    if (!id) return "Systém / administrátor";

    return (
      profiles.find(
        (profile) => String(profile.id) === String(id)
      )?.jmeno || "Uživatel"
    );
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Audit log</h1>
          <p>Historie administrativních změn</p>
        </div>

        <div className="profile-badge">
          {rows.length} ZÁZNAMŮ
        </div>
      </div>

      {error && (
        <div className="error-box">
          <strong>Audit log se nepodařilo načíst:</strong>
          <br />
          {error}
        </div>
      )}

      <div className="panel">
        <div className="users-toolbar">
          <div>
            <h2>Historie změn</h2>
            <p className="muted">
              Automatické záznamy administrativních akcí.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadAudit}
            disabled={loading}
          >
            {loading ? "Načítám..." : "↻ Obnovit"}
          </button>
        </div>

        {loading ? (
          <div className="empty">
            Načítání audit logu...
          </div>
        ) : !error && rows.length === 0 ? (
          <div className="empty">
            Zatím tu nejsou žádné auditní záznamy.
          </div>
        ) : (
          <div className="audit-log-list">
            {rows.map((row) => (
              <div className="audit-log-item" key={row.id}>
                <div className="audit-log-icon">🕘</div>

                <div className="audit-log-main">
                  <strong>{row.akce}</strong>

                  <div className="audit-log-detail">
                    {row.detail || "Bez detailu"}
                  </div>

                  <div className="audit-log-meta">
                    <span>{actorName(row.uzivatel_id)}</span>
                    <span>
                      {row.entita}
                      {row.entita_id
                        ? ` #${row.entita_id}`
                        : ""}
                    </span>
                  </div>
                </div>

                <time>
                  {row.created_at
                    ? new Date(
                        row.created_at
                      ).toLocaleString("cs-CZ")
                    : "-"}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DASHBOARD_IMAGES = [
  "/dashboard/dashboard-1.webp",
  "/dashboard/dashboard-2.webp",
  "/dashboard/dashboard-3.webp",
  "/dashboard/dashboard-4.webp",
  "/dashboard/dashboard-5.webp",
  "/dashboard/dashboard-6.webp",
  "/dashboard/dashboard-7.webp",
];

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
  const [vehicleToOpen, setVehicleToOpen] = useState(null);
  const [stkSoonVehicles, setStkSoonVehicles] = useState([]);
  const [showStkSoon, setShowStkSoon] = useState(false);
  const [dashboardSlide, setDashboardSlide] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedTheme = window.localStorage.getItem("cm-theme");

    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;

    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRegister, setShowRegister] =
    useState(false);

  async function loadDashboardStats() {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const limitDate = new Date(todayDate);
    limitDate.setDate(limitDate.getDate() + 30);

    const today = localDateIso(todayDate);
    const stkLimit = localDateIso(limitDate);

    const [p, v, a, vy, z, q, stk] = await Promise.all([
      supabase.from("provozovny").select("*", { count: "exact", head: true }),
      supabase.from("vozy").select("*", { count: "exact", head: true }),
      supabase
        .from("vozy")
        .select("*", { count: "exact", head: true })
        .eq("stav", "PROVOZNÍ"),
      supabase
        .from("vypravy")
        .select("*", { count: "exact", head: true })
        .eq("datum", today),
      supabase
        .from("vehicle_faults")
        .select("*", { count: "exact", head: true })
        .neq("stav", "OPRAVENO"),
      supabase
        .from("zadosti_vozidla")
        .select("*", { count: "exact", head: true })
        .eq("stav", "ČEKÁ NA VYŘÍZENÍ"),
      supabase
        .from("vozy")
        .select("id,cislo,vyrobce,typ,spz,stk")
        .not("stk", "is", null)
        .gte("stk", today)
        .lte("stk", stkLimit)
        .order("stk", { ascending: true }),
    ]);

    if (stk.error) {
      console.error("STK DASHBOARD ERROR:", stk.error);
      setStkSoonVehicles([]);
    } else {
      setStkSoonVehicles(stk.data || []);
    }

    setDashboardStats({
      vypravy: vy.count || 0,
      aktivniVozy: a.count || 0,
      vozyCelkem: v.count || 0,
      provozovny: p.count || 0,
      zavady: z.count || 0,
      cekajiciZadosti: q.count || 0,
      stkBrzy: stk.error ? 0 : (stk.data || []).length,
    });
  }

  useEffect(() => {
    if (user && page === "dashboard") {
      loadDashboardStats();
    }
  }, [page, user]);

  useEffect(() => {
    if (page !== "dashboard" || DASHBOARD_IMAGES.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setDashboardSlide(
        (current) => (current + 1) % DASHBOARD_IMAGES.length
      );
    }, 8000);

    return () => window.clearInterval(timer);
  }, [page]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      "cm-theme",
      darkMode ? "dark" : "light"
    );

    document.body.classList.toggle("cm-dark", darkMode);
    document.documentElement.style.colorScheme =
      darkMode ? "dark" : "light";

    return () => {
      document.body.classList.remove("cm-dark");
      document.documentElement.style.colorScheme = "";
    };
  }, [darkMode]);


  async function loadUnreadNotifications(targetUser = user) {
    if (!targetUser?.id) {
      setUnreadNotifications(0);
      return;
    }

    const { count, error: unreadError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("uzivatel_id", targetUser.id)
      .eq("precteno", false);

    if (unreadError) {
      console.error("UNREAD NOTIFICATIONS ERROR:", unreadError);
      return;
    }

    setUnreadNotifications(Number(count || 0));
  }

  useEffect(() => {
    if (!user?.id) {
      setUnreadNotifications(0);
      return;
    }

    loadUnreadNotifications(user);

    const channel = supabase
      .channel(`notifications-global-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `uzivatel_id=eq.${user.id}`,
        },
        (payload) => {
          loadUnreadNotifications(user);

          if (
            payload.eventType === "INSERT" &&
            payload.new &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            window.Notification.permission === "granted"
          ) {
            try {
              const popup = new window.Notification(
                payload.new.typ || "Czech Mobility",
                {
                  body: payload.new.zprava || "Máš nové oznámení.",
                }
              );

              popup.onclick = () => {
                window.focus();
                setPage("notifications");
                popup.close();
              };
            } catch (notificationError) {
              console.error(
                "BROWSER NOTIFICATION ERROR:",
                notificationError
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  // Pokud už profil máme, jeho tiché obnovení nesmí odmontovat
  // právě otevřenou stránku a rozepsané formuláře.
  if (loading || (profileLoading && !profile)) {
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

      <div className={`app ${darkMode ? "dark-mode" : "light-mode"}`}>
        <header className="mobile-app-bar">
          <div className="mobile-app-brand">
            <div className="mobile-app-logo"><img src="/cm-logo.png" alt="CM" /></div>
            <div>
              <strong>Czech Mobility</strong>
              <span>{roleName}</span>
            </div>
          </div>

          <div className="mobile-app-actions">
            <button
              type="button"
              className="mobile-theme-button"
              onClick={() => setDarkMode((old) => !old)}
              aria-label={
                darkMode
                  ? "Přepnout na světlý režim"
                  : "Přepnout na tmavý režim"
              }
              title={
                darkMode
                  ? "Světlý režim"
                  : "Tmavý režim"
              }
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen((old) => !old)}
              aria-label={mobileMenuOpen ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <button
            type="button"
            className="mobile-menu-overlay"
            aria-label="Zavřít menu"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div className="brand">
            <div className="brand-logo"><img src="/cm-logo.png" alt="CM" /></div>

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

          <nav
            className="menu"
            onClick={(e) => {
              if (
                e.target.closest("button") &&
                window.innerWidth <= 700
              ) {
                setMobileMenuOpen(false);
              }
            }}
          >
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

            <button
              className={page === "notifications" ? "active" : ""}
              onClick={() => setPage("notifications")}
            >
              <span>🔔</span>
              <span className="menu-notification-label">
                Notifikace
                {unreadNotifications > 0 && (
                  <span className="menu-notification-count">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </span>
            </button>
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
                  page === "adminCourses"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage("adminCourses")
                }
              >
                <span>🧭</span>
                Kurzy
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

          <div className="theme-switch-wrap">
            <button
              type="button"
              className="theme-switch"
              onClick={() => setDarkMode((old) => !old)}
              aria-pressed={darkMode}
              title={
                darkMode
                  ? "Přepnout na světlý režim"
                  : "Přepnout na tmavý režim"
              }
            >
              <span className="theme-switch-icon">
                {darkMode ? "☀" : "☾"}
              </span>

              <span className="theme-switch-copy">
                <strong>
                  {darkMode
                    ? "Světlý režim"
                    : "Tmavý režim"}
                </strong>
                <small>
                  {darkMode
                    ? "Přepnout vzhled na světlý"
                    : "Přepnout vzhled na tmavý"}
                </small>
              </span>

              <span
                className={`theme-switch-track ${
                  darkMode ? "on" : ""
                }`}
                aria-hidden="true"
              >
                <span className="theme-switch-thumb" />
              </span>
            </button>
          </div>

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
            <div className="dashboard-photo-page">
              <section className="dashboard-photo-hero">
                <div className="dashboard-slides" aria-hidden="true">
                  {DASHBOARD_IMAGES.map((image, index) => (
                    <div
                      key={image}
                      className={`dashboard-slide ${
                        index === dashboardSlide ? "active" : ""
                      }`}
                      style={{ backgroundImage: `url("${image}")` }}
                    />
                  ))}
                </div>

                <div className="dashboard-photo-shade" />

                <div className="dashboard-hero-content">
                  <header className="dashboard-hero-head">
                    <div>
                      <span className="dashboard-hero-kicker">
                        CZECH MOBILITY · VDP SYSTÉM
                      </span>

                      <h1>
                        {profile?.jmeno
                          ? `Vítej, ${profile.jmeno}`
                          : "Dashboard"}
                      </h1>

                      <p>
                        {new Date().toLocaleDateString("cs-CZ", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {" · "}
                        {roleName}
                      </p>
                    </div>

                    <div className="dashboard-hero-live">
                      <span className="dashboard-live-dot" />
                      ŽIVÝ PŘEHLED
                    </div>
                  </header>

                  <div className="dashboard-glass-stats">
                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setPage("departures")}
                    >
                      <span className="dashboard-glass-icon">◈</span>
                      <span className="dashboard-glass-label">
                        Dnešní výpravy
                      </span>
                      <strong>{dashboardStats.vypravy}</strong>
                      <small>Otevřít výpravy →</small>
                    </button>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setShowStkSoon(true)}
                    >
                      <span className="dashboard-glass-icon">✓</span>
                      <span className="dashboard-glass-label">
                        STK do 30 dní
                      </span>
                      <strong>{dashboardStats.stkBrzy}</strong>
                      <small>Zobrazit vozy →</small>
                    </button>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() =>
                        setPage(
                          manageVehicles
                            ? "adminVehicleRequests"
                            : "vehicleRequest"
                        )
                      }
                    >
                      <span className="dashboard-glass-icon">⌛</span>
                      <span className="dashboard-glass-label">
                        Čekající žádosti
                      </span>
                      <strong>{dashboardStats.cekajiciZadosti}</strong>
                      <small>Zobrazit žádosti →</small>
                    </button>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setPage("faults")}
                    >
                      <span className="dashboard-glass-icon">⚠</span>
                      <span className="dashboard-glass-label">
                        Aktivní závady
                      </span>
                      <strong>{dashboardStats.zavady}</strong>
                      <small>Zobrazit závady →</small>
                    </button>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setPage("vehicles")}
                    >
                      <span className="dashboard-glass-icon">▣</span>
                      <span className="dashboard-glass-label">
                        Aktivní vozy
                      </span>
                      <strong>{dashboardStats.aktivniVozy}</strong>
                      <small>Otevřít vozy →</small>
                    </button>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setPage("vehicles")}
                    >
                      <span className="dashboard-glass-icon">#</span>
                      <span className="dashboard-glass-label">
                        Vozy celkem
                      </span>
                      <strong>{dashboardStats.vozyCelkem}</strong>
                      <small>Otevřít vozový park →</small>
                    </button>

                    <div className="dashboard-glass-card">
                      <span className="dashboard-glass-icon">⌂</span>
                      <span className="dashboard-glass-label">
                        Provozovny
                      </span>
                      <strong>{dashboardStats.provozovny}</strong>
                      <small>Aktivní v systému</small>
                    </div>

                    <button
                      type="button"
                      className="dashboard-glass-card clickable"
                      onClick={() => setPage("notifications")}
                    >
                      <span className="dashboard-glass-icon">🔔</span>
                      <span className="dashboard-glass-label">
                        Nová oznámení
                      </span>
                      <strong>{unreadNotifications}</strong>
                      <small>Otevřít notifikace →</small>
                    </button>
                  </div>

                  <div className="dashboard-slider-bar">
                    <button
                      type="button"
                      className="dashboard-slider-arrow"
                      onClick={() =>
                        setDashboardSlide(
                          (current) =>
                            (current - 1 + DASHBOARD_IMAGES.length) %
                            DASHBOARD_IMAGES.length
                        )
                      }
                      aria-label="Předchozí fotografie"
                    >
                      ‹
                    </button>

                    <div className="dashboard-slider-dots">
                      {DASHBOARD_IMAGES.map((_, index) => (
                        <button
                          type="button"
                          key={index}
                          className={`dashboard-slider-dot ${
                            index === dashboardSlide ? "active" : ""
                          }`}
                          onClick={() => setDashboardSlide(index)}
                          aria-label={`Fotografie ${index + 1}`}
                        />
                      ))}
                    </div>

                    <span className="dashboard-slider-count">
                      {dashboardSlide + 1} / {DASHBOARD_IMAGES.length}
                    </span>

                    <button
                      type="button"
                      className="dashboard-slider-arrow"
                      onClick={() =>
                        setDashboardSlide(
                          (current) =>
                            (current + 1) % DASHBOARD_IMAGES.length
                        )
                      }
                      aria-label="Další fotografie"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </section>

              {showStkSoon && (
                <div
                  className="stk-dashboard-modal-backdrop"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowStkSoon(false);
                    }
                  }}
                >
                  <div className="stk-dashboard-modal">
                    <div className="stk-dashboard-modal-head">
                      <div>
                        <span>STK</span>
                        <h2>Vozy se STK do 30 dní</h2>
                        <p>
                          {stkSoonVehicles.length === 0
                            ? "Žádnému vozu nyní STK do 30 dní nekončí."
                            : `${stkSoonVehicles.length} ${
                                stkSoonVehicles.length === 1 ? "vůz" : "vozů"
                              } vyžaduje kontrolu.`}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="stk-dashboard-modal-close"
                        onClick={() => setShowStkSoon(false)}
                        aria-label="Zavřít"
                      >
                        ✕
                      </button>
                    </div>

                    {stkSoonVehicles.length === 0 ? (
                      <div className="empty">
                        Žádné STK v následujících 30 dnech.
                      </div>
                    ) : (
                      <div className="stk-dashboard-list">
                        {stkSoonVehicles.map((vehicle) => {
                          const status = getStkStatus(vehicle.stk);

                          return (
                            <button
                              key={vehicle.id}
                              type="button"
                              className="stk-dashboard-item"
                              onClick={() => {
                                setShowStkSoon(false);
                                setVehicleToOpen(vehicle.id);
                                setPage("vehicles");
                              }}
                            >
                              <div className="stk-dashboard-vehicle">
                                <strong>Vůz {vehicle.cislo ?? "-"}</strong>
                                <span>
                                  {vehicle.vyrobce || "-"} {vehicle.typ || ""}
                                </span>
                                {vehicle.spz && <small>SPZ: {vehicle.spz}</small>}
                              </div>

                              <div className="stk-dashboard-date">
                                <span>STK do</span>
                                <strong>{formatStkForDisplay(vehicle.stk)}</strong>
                                {status && (
                                  <small className={`stk-dashboard-days ${status.type}`}>
                                    {status.text}
                                  </small>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="stk-dashboard-modal-footer">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setShowStkSoon(false)}
                      >
                        Zavřít
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
            </div>
          )}

          {page === "departures" && (
            <Departures
              role={role}
              onOpenVehicle={(vehicleId) => {
                setVehicleToOpen(vehicleId);
                setPage("vehicles");
              }}
            />
          )}

          {page === "news" && (
            <News
              user={user}
              profile={profile}
              role={role}
            />
          )}

          {page === "vehicles" && (
            <Vehicles
              role={role}
              initialVehicleId={vehicleToOpen}
              onVehicleOpened={() => setVehicleToOpen(null)}
            />
          )}

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

          {page === "adminCourses" &&
            manageVehicles && (
              <AdminCourses />
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
  width: 52px;
  height: 42px;
  flex: 0 0 52px;
  border-radius: 10px;
  background: rgba(255,255,255,.96);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,.14);
}

.brand-logo img {
  width: 46px;
  height: 34px;
  object-fit: contain;
  display: block;
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


/* =========================================================
   NOTIFIKACE - EDITACE / MAZÁNÍ / POTVRZENÍ ŘIDIČE
========================================================= */
.notification-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 0 12px;
}

.notification-section-heading h2 {
  margin: 0;
  color: #172033;
  font-size: 18px;
}

.notification-section-heading p {
  margin: 4px 0 0;
  color: #7a8496;
  font-size: 12px;
}

.notification-sent-heading {
  margin-top: 30px;
}

.notification-confirm-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0 15px;
  padding: 13px 14px;
  border: 1px solid #dfe6ef;
  border-radius: 12px;
  background: #fafcff;
  cursor: pointer;
}

.notification-confirm-switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.notification-switch-ui {
  position: relative;
  width: 42px;
  height: 24px;
  flex: 0 0 42px;
  border-radius: 999px;
  background: #cbd5e1;
  transition: background .15s ease;
}

.notification-switch-ui::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.18);
  transition: transform .15s ease;
}

.notification-confirm-switch input:checked + .notification-switch-ui {
  background: #2563eb;
}

.notification-confirm-switch input:checked + .notification-switch-ui::after {
  transform: translateX(18px);
}

.notification-confirm-switch > span:last-child {
  min-width: 0;
}

.notification-confirm-switch strong {
  display: block;
  color: #283449;
  font-size: 12px;
}

.notification-confirm-switch small {
  display: block;
  margin-top: 2px;
  color: #8390a3;
  font-size: 10px;
  line-height: 1.4;
}

.notification-confirm-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #edf1f5;
}

.notification-confirm-button {
  min-height: 40px;
  padding: 9px 14px;
  border: 0;
  border-radius: 10px;
  background: #166534;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.notification-confirm-button:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.notification-confirmed {
  padding: 8px 11px;
  border-radius: 10px;
  background: #ecfdf3;
  color: #18733a;
  font-size: 11px;
  font-weight: 900;
}

.notification-confirm-state {
  max-width: 230px;
  padding: 6px 9px;
  border-radius: 999px;
  text-align: center;
  font-size: 9px;
  font-weight: 900;
  line-height: 1.35;
}

.notification-confirm-state.confirmed {
  background: #dcfce7;
  color: #18733a;
}

.notification-confirm-state.waiting {
  background: #fff4d6;
  color: #93631a;
}

.notification-admin-actions,
.notification-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #edf1f5;
}

.notification-edit-box {
  margin-top: 10px;
  padding: 15px;
  border: 1px solid #dce5f0;
  border-radius: 13px;
  background: #fafcff;
}

.notification-current-image {
  margin: 10px 0;
}

.notification-current-image img {
  display: block;
  width: min(100%, 480px);
  max-height: 280px;
  object-fit: contain;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: #eef2f7;
}

.notification-edit-file {
  margin-top: 8px;
}

.notification-sent-card {
  border-left: 4px solid #94a3b8;
}

@media (max-width: 700px) {
  .notification-card-header {
    flex-direction: column;
  }

  .notification-confirm-state {
    max-width: 100%;
  }

  .notification-admin-actions,
  .notification-edit-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .notification-admin-actions button,
  .notification-edit-actions button {
    width: 100%;
  }

  .notification-confirm-area {
    justify-content: stretch;
  }

  .notification-confirm-button,
  .notification-confirmed {
    width: 100%;
    box-sizing: border-box;
    text-align: center;
  }
}


.notification-recipient-summary {
  margin: 0 0 12px;
  padding: 9px 11px;
  border-radius: 10px;
  background: #f7f9fc;
  color: #69768b;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.notification-recipient-summary strong {
  color: #344056;
}


/* =========================================================
   ADMIN KURZY
========================================================= */
.course-admin-layout {
  display: grid;
  grid-template-columns: minmax(280px, .7fr) minmax(0, 1.3fr);
  gap: 18px;
  align-items: start;
}

.course-admin-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, .45fr);
  gap: 10px;
  margin-bottom: 15px;
}

.course-admin-filters .search {
  margin: 0;
}

.course-admin-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.course-admin-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 13px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.course-admin-item.inactive {
  opacity: .65;
  background: #f8fafc;
}

.course-admin-item > div:first-child {
  min-width: 0;
}

.course-admin-item > div:first-child strong,
.course-admin-item > div:first-child span {
  display: block;
}

.course-admin-item > div:first-child strong {
  color: #172033;
  font-size: 14px;
}

.course-admin-item > div:first-child span {
  margin-top: 3px;
  color: #7a8496;
  font-size: 11px;
}

.course-active-badge {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
}

.course-active-badge.active {
  background: #dcfce7;
  color: #18733a;
}

.course-active-badge.inactive {
  background: #e5e7eb;
  color: #64748b;
}

.course-admin-actions {
  display: flex;
  gap: 7px;
}

/* =========================================================
   VÝPRAVY - MĚSÍČNÍ TABULKA
========================================================= */
.departures-page {
  min-width: 0;
}

.departures-eyebrow {
  margin-bottom: 7px;
  color: #2f6fed;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
}

.departures-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 15px;
}

.departures-branches {
  min-width: 0;
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 3px;
}

.departures-branches button {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 7px 11px;
  border: 1px solid #d9e1ec;
  border-radius: 9px;
  background: #fff;
  color: #536176;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.departures-branches button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.departures-month-control {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 7px;
}

.departures-month-control input {
  min-height: 38px;
  padding: 7px 10px;
  border: 1px solid #d7dee9;
  border-radius: 9px;
  background: #fff;
  color: #253047;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.departures-month-control .secondary-button {
  min-width: 38px;
  padding-left: 10px;
  padding-right: 10px;
  font-size: 20px;
}

.departures-table-wrap {
  width: 100%;
  overflow: auto;
  border: 1px solid #d8e0ea;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 7px 20px rgba(23,32,51,.04);
}

.departures-month-table {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.departures-month-table th,
.departures-month-table td {
  border-right: 1px solid #dbe2eb;
  border-bottom: 1px solid #dbe2eb;
}

.departures-month-table thead th {
  position: sticky;
  top: 0;
  z-index: 4;
  width: 66px;
  min-width: 66px;
  height: 50px;
  padding: 5px 3px;
  background: #eef3f8;
  color: #526072;
  text-align: center;
  font-size: 10px;
}

.departures-month-table thead th span,
.departures-month-table thead th strong {
  display: block;
}

.departures-month-table thead th strong {
  margin-top: 3px;
  color: #172033;
  font-size: 13px;
}

.departures-month-table th.weekend,
.departures-month-table td.weekend {
  background: #fff7ed;
}

.departures-month-table th.today {
  background: #dbeafe;
}

.departures-month-table td.today {
  box-shadow: inset 2px 0 #3b82f6, inset -2px 0 #3b82f6;
}

.departures-vehicle-column {
  position: sticky !important;
  left: 0;
  z-index: 3;
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px;
  padding: 9px 10px !important;
  background: #f8fafc !important;
  text-align: left !important;
}

thead .departures-vehicle-column {
  z-index: 6 !important;
  background: #e8eef5 !important;
}

.departures-vehicle-column strong,
.departures-vehicle-column small {
  display: block;
}

.departures-vehicle-column strong {
  color: #172033;
  font-size: 13px;
}

.departures-vehicle-column small {
  margin-top: 2px;
  overflow: hidden;
  color: #8791a1;
  font-size: 9px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.departure-cell {
  width: 66px;
  min-width: 66px;
  max-width: 66px;
  height: 57px;
  padding: 3px;
  background: #fff;
  text-align: center;
  vertical-align: middle;
}

.departure-cell.editable {
  cursor: pointer;
}

.departure-cell.editable:hover {
  background: #f0f6ff;
}

.departure-cell.filled {
  background: #f2f8ff;
}

.departure-cell-content {
  display: flex;
  min-height: 45px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
}

.departure-cell-content strong {
  max-width: 60px;
  overflow: hidden;
  color: #172033;
  font-size: 10px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.departure-cell-content small {
  max-width: 58px;
  overflow: hidden;
  color: #6b7280;
  font-size: 7px;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.departure-cell-empty {
  color: #b8c1cd;
  font-size: 18px;
  font-weight: 500;
}

.departures-warning {
  margin-top: 13px;
  padding: 12px 14px;
  border: 1px solid #f0d69f;
  border-radius: 11px;
  background: #fffbeb;
  color: #855d18;
  font-size: 12px;
}

.departure-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15,23,42,.48);
  backdrop-filter: blur(2px);
}

.departure-modal {
  width: min(100%, 520px);
  max-height: calc(100vh - 36px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 25px 80px rgba(15,23,42,.28);
}

.departure-modal-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 17px;
}

.departure-modal-head span {
  color: #2f6fed;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.departure-modal-head h2 {
  margin: 4px 0 0;
  color: #172033;
  font-size: 20px;
}

.departure-modal-head p {
  margin: 4px 0 0;
  color: #7a8496;
  font-size: 11px;
}

.departure-modal-close {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border: 1px solid #dbe2eb;
  border-radius: 9px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.departure-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf1f5;
}

.departure-modal-actions > div {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 900px) {
  .course-admin-layout {
    grid-template-columns: 1fr;
  }

  .departures-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .departures-month-control {
    justify-content: flex-start;
  }
}

@media (max-width: 700px) {
  .course-admin-filters,
  .course-admin-item {
    grid-template-columns: 1fr;
  }

  .course-admin-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .course-admin-actions button {
    width: 100%;
  }

  .departure-modal-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .departure-modal-actions > div {
    width: 100%;
    flex-direction: column;
  }

  .departure-modal-actions button {
    width: 100%;
  }
}


.departures-course-column {
  background: #f6f8fb !important;
}

.departures-course-column strong {
  font-size: 12px;
  letter-spacing: .01em;
}

.departures-course-column small {
  color: #9aa3b2;
}


/* =========================================================
   VÝPRAVY V3 - BLOKY PROVOZOVEN
========================================================= */
.departures-toolbar-title {
  min-width: 0;
}

.departures-toolbar-title strong,
.departures-toolbar-title span {
  display: block;
}

.departures-toolbar-title strong {
  color: #172033;
  font-size: 13px;
}

.departures-toolbar-title span {
  margin-top: 3px;
  color: #7a8496;
  font-size: 10px;
}

.departure-branch-row td {
  border-top: 7px solid #f4f6fa !important;
}

.departure-branch-title {
  position: relative;
  z-index: 2;
  padding: 10px 13px !important;
  background: #eaf0f8 !important;
  color: #253047;
  text-align: left !important;
}

.departure-branch-title strong {
  font-size: 12px;
  font-weight: 900;
}

.departure-branch-title span {
  margin-left: 9px;
  color: #7b8798;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.departure-branch-empty {
  padding: 11px 14px !important;
  background: #fafbfc !important;
  color: #9aa3b2;
  font-size: 10px;
  font-style: italic;
}

.departure-branch-empty-row + .departure-branch-row td {
  border-top-width: 8px !important;
}

@media (max-width: 900px) {
  .departures-toolbar-title span {
    max-width: 520px;
  }
}


/* =========================================================
   VÝPRAVY V4 - PROVOZOVNY V ZÁLOŽKÁCH, ŘÁDKY = VOZY
========================================================= */
.departures-tabs {
  padding-bottom: 0;
  border-bottom: 1px solid #e3e8ef;
}

.departures-tabs button {
  border-radius: 9px 9px 0 0;
  border-bottom: 0;
}

.departures-tabs button.active {
  box-shadow: inset 0 -3px rgba(255,255,255,.7);
}

.departures-selected-branch {
  display: flex;
  align-items: stretch;
  gap: 1px;
  margin: 0 0 12px;
  overflow: hidden;
  border: 1px solid #dce4ee;
  border-radius: 11px;
  background: #dce4ee;
}

.departures-selected-branch > div {
  min-width: 120px;
  padding: 9px 13px;
  background: #fff;
}

.departures-selected-branch > div:first-child {
  flex: 1;
  background: #f3f7fc;
}

.departures-selected-branch span,
.departures-selected-branch strong {
  display: block;
}

.departures-selected-branch span {
  color: #8a95a5;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .08em;
}

.departures-selected-branch strong {
  margin-top: 3px;
  color: #1f2a3d;
  font-size: 12px;
}

@media (max-width: 700px) {
  .departures-selected-branch {
    flex-direction: column;
  }

  .departures-selected-branch > div {
    min-width: 0;
  }
}


/* =========================================================
   VÝPRAVY V5 - KURZY VIDITELNÉ U KAŽDÉHO VOZU
========================================================= */
.departures-vehicle-with-courses {
  width: 210px !important;
  min-width: 210px !important;
  max-width: 210px !important;
}

.vehicle-course-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 7px;
}

.vehicle-course-chip {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 2px 5px;
  border: 1px solid #dbe5f2;
  border-radius: 5px;
  background: #f3f7fd;
  color: #34527c;
  font-size: 7px;
  font-weight: 800;
  line-height: 1.1;
}

.vehicle-course-chip.empty {
  background: #f8fafc;
  color: #98a2b2;
}

.departure-course-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 7px;
  margin-top: 5px;
}

.departure-course-picker button {
  min-height: 38px;
  padding: 7px 9px;
  border: 1px solid #d7dfeb;
  border-radius: 9px;
  background: #f8fafc;
  color: #344155;
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.departure-course-picker button:hover {
  border-color: #8eb3f7;
  background: #f1f6ff;
}

.departure-course-picker button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
  box-shadow: 0 4px 12px rgba(37,99,235,.18);
}

.departure-course-empty {
  padding: 12px;
  border: 1px dashed #d6dde8;
  border-radius: 9px;
  background: #fafbfc;
  color: #8c96a6;
  font-size: 11px;
}

@media (max-width: 700px) {
  .departures-vehicle-with-courses {
    width: 175px !important;
    min-width: 175px !important;
    max-width: 175px !important;
  }

  .departure-course-picker {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}


/* =========================================================
   VÝPRAVY - KLIKACÍ VŮZ
========================================================= */
.departure-vehicle-link {
  width: 100%;
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.departure-vehicle-link strong,
.departure-vehicle-link small {
  display: block;
}

.departure-vehicle-link strong {
  color: #172033;
  transition: color .15s ease;
}

.departure-vehicle-link small {
  margin-top: 2px;
}

.departure-vehicle-link:hover strong {
  color: #2563eb;
  text-decoration: underline;
}

.departure-vehicle-link:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 4px;
  border-radius: 4px;
}


/* =========================================================
   VÝPRAVY - SKUPINY POŘADÍ
========================================================= */
.departure-course-groups {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 6px;
}

.departure-course-group {
  padding: 10px;
  border: 1px solid #e1e7ef;
  border-radius: 11px;
  background: #fafcff;
}

.departure-course-group-title {
  margin-bottom: 8px;
  color: #334155;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.departure-course-group .departure-course-picker {
  margin-top: 0;
}

@media (max-width: 700px) {
  .departure-course-group {
    padding: 8px;
  }
}


/* =========================================================
   VÝPRAVY - KONTROLA NEVYPRAVENÝCH POŘADÍ
========================================================= */
.departures-month-table thead th {
  position: sticky;
}

.departure-missing-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 16px;
  margin-top: 3px;
  padding: 0 4px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 8px;
  font-style: normal;
  font-weight: 900;
}

.departure-missing-row td {
  border-top: 2px solid #f1b7b7 !important;
}

.departure-missing-label {
  background: #fff1f2 !important;
  color: #991b1b !important;
}

.departure-missing-label strong {
  color: #991b1b !important;
}

.departure-missing-cell {
  width: 66px;
  min-width: 66px;
  max-width: 66px;
  padding: 4px 3px;
  text-align: center;
  vertical-align: top;
}

.departure-missing-cell.has-missing {
  background: #fff1f2;
}

.departure-missing-cell.all-dispatched {
  background: #f0fdf4;
}

.departure-all-ok {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  min-height: 22px;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
  font-size: 11px;
  font-weight: 900;
}

.departure-missing-list > strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  margin-bottom: 4px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.departure-missing-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 90px;
  overflow-y: auto;
}

.departure-missing-names span {
  display: block;
  padding: 2px 3px;
  border-radius: 4px;
  background: rgba(255,255,255,.72);
  color: #991b1b;
  font-size: 7px;
  font-weight: 800;
  line-height: 1.15;
}

.departure-missing-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 11px;
  background: #fff7f7;
}

.departure-missing-summary > div:first-child strong,
.departure-missing-summary > div:first-child span {
  display: block;
}

.departure-missing-summary > div:first-child strong {
  color: #991b1b;
  font-size: 12px;
}

.departure-missing-summary > div:first-child span {
  margin-top: 3px;
  color: #8f5a5a;
  font-size: 9px;
}

.departure-missing-summary-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.departure-missing-summary-stats span {
  padding: 4px 7px;
  border-radius: 999px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 8px;
  font-weight: 800;
}

@media (max-width: 700px) {
  .departure-missing-summary {
    flex-direction: column;
  }

  .departure-missing-summary-stats {
    justify-content: flex-start;
  }
}


/* =========================================================
   STK
========================================================= */
.stk-status-note {
  display: inline-flex;
  margin-top: 7px;
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
}

.stk-status-note.ok {
  background: #dcfce7;
  color: #166534;
}

.stk-status-note.soon {
  background: #fef3c7;
  color: #92400e;
}

.stk-status-note.expired {
  background: #fee2e2;
  color: #991b1b;
}


/* =========================================================
   DASHBOARD - KLIKACÍ STK DO 30 DNŮ
========================================================= */
.stat-clickable {
  width: 100%;
  border: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
}

.stat-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15,23,42,.09);
}

.stat-clickable:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
}

.stat-clickable small {
  display: block;
  margin-top: 8px;
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
}

.stk-dashboard-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15,23,42,.48);
  backdrop-filter: blur(2px);
}

.stk-dashboard-modal {
  width: min(100%, 680px);
  max-height: calc(100vh - 36px);
  overflow-y: auto;
  padding: 20px;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 25px 80px rgba(15,23,42,.28);
}

.stk-dashboard-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.stk-dashboard-modal-head > div > span {
  color: #d97706;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .08em;
}

.stk-dashboard-modal-head h2 {
  margin: 4px 0 0;
  color: #172033;
}

.stk-dashboard-modal-head p {
  margin: 5px 0 0;
  color: #7a8496;
  font-size: 11px;
}

.stk-dashboard-modal-close {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border: 1px solid #dbe2eb;
  border-radius: 9px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}

.stk-dashboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stk-dashboard-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 14px;
  border: 1px solid #e1e7ef;
  border-radius: 11px;
  background: #fff;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.stk-dashboard-item:hover {
  border-color: #93b4f5;
  background: #f8fbff;
}

.stk-dashboard-vehicle strong,
.stk-dashboard-vehicle span,
.stk-dashboard-vehicle small,
.stk-dashboard-date span,
.stk-dashboard-date strong,
.stk-dashboard-date small {
  display: block;
}

.stk-dashboard-vehicle strong {
  color: #172033;
  font-size: 13px;
}

.stk-dashboard-vehicle span {
  margin-top: 3px;
  color: #667085;
  font-size: 10px;
}

.stk-dashboard-vehicle small {
  margin-top: 3px;
  color: #98a2b3;
  font-size: 9px;
}

.stk-dashboard-date {
  min-width: 155px;
  text-align: right;
}

.stk-dashboard-date > span {
  color: #98a2b3;
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
}

.stk-dashboard-date > strong {
  margin-top: 2px;
  color: #172033;
  font-size: 13px;
}

.stk-dashboard-days {
  margin-top: 4px;
  font-size: 9px;
  font-weight: 800;
}

.stk-dashboard-days.soon {
  color: #b45309;
}

.stk-dashboard-days.expired {
  color: #b91c1c;
}

.stk-dashboard-days.ok {
  color: #15803d;
}

.stk-dashboard-modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #edf1f5;
}

@media (max-width: 600px) {
  .stk-dashboard-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .stk-dashboard-date {
    min-width: 0;
    text-align: left;
  }
}


/* =========================================================
   MOBILE UX 2026
========================================================= */
.mobile-app-bar,
.mobile-menu-overlay,
.departures-mobile-hint {
  display: none;
}

@media (max-width: 700px) {
  html,
  body,
  #root {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  body {
    -webkit-text-size-adjust: 100%;
  }

  button,
  input,
  select,
  textarea {
    font-size: 16px;
  }

  /* ----- horní mobilní lišta ----- */
  .mobile-app-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 220;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #dfe5ee;
    background: rgba(255,255,255,.97);
    box-shadow: 0 3px 14px rgba(15,23,42,.08);
    backdrop-filter: blur(10px);
  }

  .mobile-app-brand {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .mobile-app-logo {
    width: 48px;
    height: 38px;
    flex: 0 0 48px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #fff;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(15,23,42,.10);
  }

  .mobile-app-logo img {
    width: 43px;
    height: 31px;
    object-fit: contain;
    display: block;
  }

  .mobile-app-brand strong,
  .mobile-app-brand span {
    display: block;
  }

  .mobile-app-brand strong {
    overflow: hidden;
    color: #172033;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-app-brand span {
    margin-top: 1px;
    color: #788397;
    font-size: 9px;
  }

  .mobile-menu-button {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border: 1px solid #d9e1eb;
    border-radius: 11px;
    background: #f7f9fc;
    color: #172033;
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
  }

  .mobile-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 198;
    display: block;
    border: 0;
    background: rgba(15,23,42,.48);
    backdrop-filter: blur(2px);
  }

  /* ----- sidebar jako vysouvací menu ----- */
  .sidebar {
    display: flex !important;
    width: min(86vw, 320px) !important;
    padding: 16px 12px !important;
    z-index: 210;
    transform: translateX(-105%);
    transition: transform .22s ease;
    box-shadow: 16px 0 35px rgba(15,23,42,.2);
    overflow: hidden;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar .brand {
    padding: 4px 7px 16px;
  }

  .sidebar .brand-logo {
    width: 48px;
    height: 38px;
    flex-basis: 48px;
  }

  .sidebar .brand-logo img {
    width: 43px;
    height: 31px;
  }

  .sidebar .brand-title {
    font-size: 13px;
  }

  .sidebar .brand-subtitle {
    font-size: 10px;
  }

  .sidebar .section-title {
    margin-bottom: 5px;
    font-size: 9px;
  }

  .sidebar .menu {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
  }

  .sidebar .menu button {
    min-height: 44px;
    padding: 10px 11px;
    font-size: 12px;
  }

  .sidebar .menu-divider {
    margin: 9px 7px 7px;
  }

  .sidebar .user-box {
    flex: 0 0 auto;
    padding: 11px 4px 2px;
  }

  /* ----- hlavní obsah ----- */
  .content {
    margin-left: 0 !important;
    width: 100% !important;
    max-width: 100%;
    padding: 76px 12px 28px !important;
    overflow-x: hidden;
  }

  .topbar {
    gap: 8px;
    margin-bottom: 14px;
  }

  .topbar h1 {
    font-size: 24px;
    line-height: 1.15;
  }

  .topbar p {
    margin: 5px 0 0;
    font-size: 12px;
    line-height: 1.4;
  }

  .profile-badge {
    padding: 6px 9px;
    font-size: 9px;
  }

  .panel {
    margin-bottom: 14px;
    padding: 14px !important;
    border-radius: 13px;
  }

  .panel h2 {
    font-size: 17px;
  }

  .empty {
    padding: 20px 10px;
    font-size: 12px;
  }

  .error-box,
  .success-box {
    padding: 11px 12px;
    margin-bottom: 12px;
    font-size: 12px;
  }

  /* ----- dashboard ----- */
  .stats,
  .admin-user-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 9px !important;
    margin: 14px 0 !important;
  }

  .stat,
  .admin-user-stat {
    min-width: 0;
    min-height: 105px;
    padding: 13px !important;
    border-radius: 13px;
  }

  .stat span,
  .admin-user-stat span {
    font-size: 10px;
    line-height: 1.25;
  }

  .stat strong,
  .admin-user-stat strong {
    margin-top: 7px;
    font-size: 25px;
  }

  .stat-clickable small {
    margin-top: 5px;
    font-size: 8px;
  }

  /* ----- formuláře ----- */
  .form-grid,
  .course-admin-filters,
  .notification-compose-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .form-grid label,
  .notification-field label {
    font-size: 11px;
  }

  .form-grid input,
  .form-grid select,
  .form-input,
  .notification-field input,
  .notification-field select,
  .notification-field textarea,
  .search,
  .provozovna-bar select {
    min-height: 44px;
    padding: 10px 11px;
  }

  textarea {
    min-height: 96px;
  }

  .form-buttons,
  .vehicle-actions,
  .report-actions {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 7px !important;
  }

  .form-buttons button,
  .vehicle-actions button,
  .report-actions button {
    width: 100%;
    min-height: 42px;
  }

  .primary-button,
  .secondary-button,
  .delete-button {
    min-height: 42px;
    padding: 9px 11px;
  }

  .users-toolbar,
  .provozovna-bar {
    align-items: stretch !important;
    flex-direction: column !important;
  }

  /* ----- seznamy vozů / admin ----- */
  .vehicle-header {
    display: none !important;
  }

  .vehicle-row {
    grid-template-columns: 60px minmax(0, 1fr) !important;
    gap: 7px 10px !important;
    margin-bottom: 8px;
    padding: 12px !important;
    border: 1px solid #e4e9f0;
    border-radius: 12px;
    background: #fff;
  }

  .vehicle-row > * {
    min-width: 0;
    margin: 0 !important;
  }

  .vehicle-row > span:nth-child(n+3) {
    grid-column: 2;
  }

  .vehicle-status {
    width: fit-content;
    max-width: 100%;
    font-size: 9px !important;
    line-height: 1.2;
  }

  .admin-vehicle-card {
    grid-template-columns: 52px minmax(0, 1fr) !important;
    gap: 9px !important;
    margin-bottom: 8px;
    padding: 12px !important;
    border: 1px solid #e4e9f0;
    border-radius: 12px;
  }

  .admin-vehicle-card .vehicle-number {
    width: 48px;
    height: 48px;
    font-size: 15px;
  }

  .admin-vehicle-card .vehicle-status,
  .admin-vehicle-card .vehicle-actions {
    grid-column: 1 / -1;
  }

  .vehicle-main strong {
    font-size: 12px;
  }

  .vehicle-main small {
    font-size: 9px;
    overflow-wrap: anywhere;
  }

  /* ----- obecné listy ----- */
  .simple-list-item {
    gap: 9px !important;
    padding: 11px !important;
    border-radius: 10px;
  }

  .simple-list-item strong {
    font-size: 12px;
  }

  .simple-list-item div,
  .simple-list-item small {
    font-size: 10px;
    overflow-wrap: anywhere;
  }

  .user-card,
  .report-card,
  .course-admin-item {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
    padding: 12px !important;
  }

  /* ----- Výpravy ----- */
  .departures-toolbar {
    gap: 10px;
    padding: 10px !important;
  }

  .departures-tabs {
    width: 100%;
    display: flex;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    padding-bottom: 4px;
  }

  .departures-tabs button {
    min-height: 40px;
    padding: 7px 10px;
    scroll-snap-align: start;
    font-size: 10px;
  }

  .departures-month-control {
    width: 100%;
    display: grid !important;
    grid-template-columns: 42px minmax(0, 1fr) 42px;
    gap: 6px;
  }

  .departures-month-control input {
    width: 100%;
    min-width: 0;
    font-size: 14px;
  }

  .departures-selected-branch {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    margin-bottom: 9px;
  }

  .departures-selected-branch > div:first-child {
    grid-column: 1 / -1;
  }

  .departures-selected-branch > div {
    min-width: 0 !important;
    padding: 8px 10px;
  }

  .departures-mobile-hint {
    display: block;
    margin: -3px 0 7px;
    color: #748094;
    font-size: 9px;
    font-weight: 700;
  }

  .departures-table-wrap {
    max-width: calc(100vw - 24px);
    border-radius: 10px;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  .departures-month-table thead th {
    width: 52px;
    min-width: 52px;
    height: 44px;
    font-size: 8px;
  }

  .departures-month-table thead th strong {
    font-size: 11px;
  }

  .departures-vehicle-column {
    width: 112px !important;
    min-width: 112px !important;
    max-width: 112px !important;
    padding: 7px !important;
    box-shadow: 3px 0 7px rgba(15,23,42,.07);
  }

  .departures-vehicle-column strong {
    font-size: 11px;
  }

  .departures-vehicle-column small {
    font-size: 7px;
  }

  .departure-cell {
    width: 52px;
    min-width: 52px;
    max-width: 52px;
    height: 50px;
    padding: 2px;
  }

  .departure-cell-content {
    min-height: 42px;
  }

  .departure-cell-content strong {
    max-width: 48px;
    font-size: 8px;
  }

  .departure-cell-empty {
    font-size: 16px;
  }

  .departure-missing-cell {
    width: 52px !important;
    min-width: 52px !important;
    max-width: 52px !important;
  }

  .departure-missing-names {
    max-height: 70px;
  }

  .departure-missing-names span {
    font-size: 6px;
  }

  /* ----- modály jako mobilní sheet ----- */
  .departure-modal-backdrop,
  .stk-dashboard-modal-backdrop {
    align-items: end !important;
    padding: 0 !important;
  }

  .departure-modal,
  .stk-dashboard-modal {
    width: 100% !important;
    max-width: none !important;
    max-height: 92dvh !important;
    padding: 16px 13px calc(16px + env(safe-area-inset-bottom)) !important;
    border-radius: 18px 18px 0 0 !important;
    box-shadow: 0 -16px 50px rgba(15,23,42,.22) !important;
  }

  .departure-modal-head,
  .stk-dashboard-modal-head {
    margin-bottom: 12px;
  }

  .departure-modal-head h2,
  .stk-dashboard-modal-head h2 {
    font-size: 18px;
  }

  .departure-course-picker {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 6px;
  }

  .departure-course-picker button {
    min-height: 42px;
    padding: 7px;
    font-size: 10px;
  }

  .departure-course-group {
    padding: 8px !important;
  }

  .departure-modal-actions {
    position: sticky;
    bottom: -16px;
    z-index: 2;
    margin: 12px -13px -16px;
    padding: 10px 13px calc(10px + env(safe-area-inset-bottom));
    background: #fff;
  }

  .stk-dashboard-item {
    gap: 8px;
    padding: 11px;
  }

  /* ----- tabulky mimo Výpravy ----- */
  .table-scroll {
    max-width: calc(100vw - 24px);
    -webkit-overflow-scrolling: touch;
  }

  .data-table {
    min-width: 720px;
  }

  .data-table th,
  .data-table td {
    padding: 9px;
    font-size: 10px;
  }

  /* ----- detail vozu ----- */
  .vehicle-extra-panel {
    margin-top: 15px !important;
    padding-top: 13px !important;
  }
}

@media (max-width: 380px) {
  .stats,
  .admin-user-stats {
    grid-template-columns: 1fr !important;
  }

  .content {
    padding-left: 9px !important;
    padding-right: 9px !important;
  }

  .departures-table-wrap,
  .table-scroll {
    max-width: calc(100vw - 18px);
  }

  .departures-vehicle-column {
    width: 102px !important;
    min-width: 102px !important;
    max-width: 102px !important;
  }

  .departure-cell,
  .departures-month-table thead th,
  .departure-missing-cell {
    width: 49px !important;
    min-width: 49px !important;
    max-width: 49px !important;
  }
}


/* =========================================================
   AUDIT LOG
========================================================= */
.audit-log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.audit-log-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 11px;
  align-items: center;
  padding: 12px 13px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #fff;
}

.audit-log-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #f1f5f9;
  font-size: 15px;
}

.audit-log-main {
  min-width: 0;
}

.audit-log-main > strong {
  display: block;
  color: #172033;
  font-size: 12px;
}

.audit-log-detail {
  margin-top: 3px;
  color: #596579;
  font-size: 10px;
  overflow-wrap: anywhere;
}

.audit-log-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 10px;
  margin-top: 5px;
  color: #8a95a5;
  font-size: 9px;
}

.audit-log-item time {
  color: #7b8798;
  font-size: 9px;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .audit-log-item {
    grid-template-columns: 34px minmax(0, 1fr);
    align-items: start;
  }

  .audit-log-icon {
    width: 32px;
    height: 32px;
  }

  .audit-log-item time {
    grid-column: 2;
    white-space: normal;
  }
}


/* =========================================================
   NOTIFIKACE - REALTIME DORUČOVÁNÍ
========================================================= */
.notification-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notification-browser-enabled {
  border-color: #bbf7d0 !important;
  background: #f0fdf4 !important;
  color: #18733a !important;
}

.menu-notification-label {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}

.menu-notification-count {
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 2px 7px rgba(220,38,38,.25);
}

@media (max-width: 700px) {
  .notification-topbar-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .notification-topbar-actions button {
    width: 100%;
  }

  .menu-notification-count {
    min-width: 22px;
    height: 22px;
    font-size: 10px;
  }
}


/* =========================================================
   KURZY - TYP DNE / VOZU / ČASY
========================================================= */
.departure-course-picker button strong,
.departure-course-picker button small {
  display: block;
}

.departure-course-picker button strong {
  font-size: 10px;
}

.departure-course-picker button small {
  margin-top: 3px;
  opacity: .72;
  font-size: 8px;
  font-weight: 700;
}


/* =========================================================
   KURZY - PRACOVNÍ DEN / VÍKEND
========================================================= */
.course-day-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.course-day-section {
  padding: 12px;
  border: 1px solid #e1e7ef;
  border-radius: 13px;
  background: #fbfcfe;
}

.course-day-section.workday {
  border-left: 4px solid #2563eb;
}

.course-day-section.weekend {
  border-left: 4px solid #f59e0b;
}

.course-day-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.course-day-section-title > div strong,
.course-day-section-title > div span {
  display: block;
}

.course-day-section-title > div strong {
  color: #172033;
  font-size: 14px;
}

.course-day-section-title > div span {
  margin-top: 2px;
  color: #8490a2;
  font-size: 9px;
}

.course-day-chip {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: #eef2f7;
  color: #475569;
  font-size: 8px;
  font-weight: 900;
}

.course-day-section.workday .course-day-chip {
  background: #dbeafe;
  color: #1d4ed8;
}

.course-day-section.weekend .course-day-chip {
  background: #fef3c7;
  color: #92400e;
}

.departure-day-type-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #f8fafc;
}

.departure-day-type-banner span {
  color: #7a8496;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.departure-day-type-banner strong {
  color: #172033;
  font-size: 12px;
}

@media (max-width: 700px) {
  .course-day-section {
    padding: 9px;
  }
}


/* =========================================================
   DASHBOARD - FOTOGRAFICKÁ SLIDESHOW
========================================================= */
.dashboard-photo-page {
  margin: -35px;
  min-height: 100vh;
}

.dashboard-photo-hero {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #0b1220;
  isolation: isolate;
}

.dashboard-slides,
.dashboard-slide,
.dashboard-photo-shade {
  position: absolute;
  inset: 0;
}

.dashboard-slide {
  z-index: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.035);
  filter: brightness(1.32) saturate(1.12) contrast(1.03);
  transition:
    opacity 1.25s ease,
    transform 9s ease;
  will-change: opacity, transform;
}

.dashboard-slide.active {
  opacity: 1;
  transform: scale(1);
}

.dashboard-photo-shade {
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      rgba(4, 10, 22, .18) 0%,
      rgba(4, 10, 22, .06) 42%,
      rgba(4, 10, 22, 0) 75%
    ),
    linear-gradient(
      0deg,
      rgba(4, 10, 22, .24) 0%,
      rgba(4, 10, 22, .06) 34%,
      transparent 58%,
      rgba(4, 10, 22, .05) 100%
    );
}

.dashboard-hero-content {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  padding: clamp(34px, 5vw, 72px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
}

.dashboard-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.dashboard-hero-kicker {
  display: block;
  margin-bottom: 10px;
  color: rgba(255,255,255,.72);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .16em;
}

.dashboard-hero-head h1 {
  margin: 0;
  max-width: 760px;
  color: #fff;
  font-size: clamp(34px, 4.7vw, 72px);
  line-height: .98;
  letter-spacing: -.045em;
  text-shadow: 0 3px 14px rgba(0,0,0,.82), 0 1px 3px rgba(0,0,0,.9);
}

.dashboard-hero-head p {
  margin: 13px 0 0;
  color: rgba(255,255,255,.76);
  font-size: 13px;
  font-weight: 700;
  text-transform: capitalize;
}

.dashboard-hero-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: 1px solid rgba(255,255,255,.30);
  border-radius: 999px;
  background: rgba(10,18,34,.36);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255,255,255,.9);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .09em;
  white-space: nowrap;
}

.dashboard-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34,197,94,.16);
}

.dashboard-glass-stats {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 11px;
  margin: auto 0 20px;
  padding-top: 60px;
}

.dashboard-glass-card {
  appearance: none;
  min-width: 0;
  min-height: 145px;
  padding: 16px;
  text-align: left;
  color: #fff;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 16px;
  background:
    linear-gradient(
      145deg,
      rgba(8,15,28,.18),
      rgba(8,15,28,.08)
    );
  box-shadow:
    0 8px 22px rgba(0,0,0,.12),
    inset 0 1px 0 rgba(255,255,255,.12);
  backdrop-filter: blur(1.5px) saturate(1.03);
  -webkit-backdrop-filter: blur(1.5px) saturate(1.03);
  display: flex;
  flex-direction: column;
  font-family: inherit;
}

.dashboard-glass-card.clickable {
  cursor: pointer;
  transition:
    transform .18s ease,
    background .18s ease,
    border-color .18s ease;
}

.dashboard-glass-card.clickable:hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,.34);
  background:
    linear-gradient(
      145deg,
      rgba(8,15,28,.25),
      rgba(8,15,28,.11)
    );
}

.dashboard-glass-icon {
  width: 29px;
  height: 29px;
  margin-bottom: 14px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 9px;
  background: rgba(255,255,255,.12);
  font-size: 12px;
  font-weight: 900;
}

.dashboard-glass-label {
  color: rgba(255,255,255,.76);
  font-size: 10px;
  font-weight: 800;
}

.dashboard-glass-card strong {
  display: block;
  margin-top: 4px;
  color: #fff;
  font-size: clamp(27px, 3vw, 42px);
  line-height: 1;
  letter-spacing: -.04em;
}

.dashboard-glass-card small {
  margin-top: auto;
  padding-top: 12px;
  color: rgba(255,255,255,.58);
  font-size: 8px;
  font-weight: 700;
}

.dashboard-slider-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dashboard-slider-arrow {
  appearance: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 50%;
  background: rgba(10,18,34,.35);
  color: #fff;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  backdrop-filter: blur(10px);
}

.dashboard-slider-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dashboard-slider-dot {
  appearance: none;
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255,255,255,.40);
  cursor: pointer;
  transition: width .2s ease, background .2s ease;
}

.dashboard-slider-dot.active {
  width: 24px;
  background: #fff;
}

.dashboard-slider-count {
  color: rgba(255,255,255,.65);
  font-size: 9px;
  font-weight: 800;
}

/* STK modal musí být nad slideshow */
.stk-dashboard-modal-backdrop {
  z-index: 2000 !important;
}

@media (max-width: 1050px) {
  .dashboard-glass-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .dashboard-photo-page {
    margin: -76px -12px -28px;
    min-height: 100dvh;
  }

  .dashboard-photo-hero {
    min-height: 100dvh;
  }

  .dashboard-hero-content {
    min-height: 100dvh;
    padding:
      calc(60px + 20px)
      13px
      max(17px, env(safe-area-inset-bottom));
  }

  .dashboard-photo-shade {
    background:
      linear-gradient(
        0deg,
        rgba(4,10,22,.34) 0%,
        rgba(4,10,22,.12) 52%,
        rgba(4,10,22,.06) 100%
      );
  }

  .dashboard-hero-head {
    gap: 10px;
  }

  .dashboard-hero-head h1 {
    font-size: clamp(29px, 9vw, 43px);
  }

  .dashboard-hero-head p {
    max-width: 250px;
    font-size: 10px;
    line-height: 1.4;
  }

  .dashboard-hero-live {
    padding: 7px 8px;
    font-size: 7px;
  }

  .dashboard-glass-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 7px !important;
    margin: auto 0 14px !important;
    padding-top: 30px;
  }

  .dashboard-glass-card {
    min-height: 116px !important;
    padding: 11px !important;
    border-radius: 13px;
  }

  .dashboard-glass-icon {
    width: 25px;
    height: 25px;
    margin-bottom: 8px;
  }

  .dashboard-glass-label {
    font-size: 8px;
  }

  .dashboard-glass-card strong {
    margin-top: 3px !important;
    font-size: 27px !important;
  }

  .dashboard-glass-card small {
    padding-top: 7px;
    font-size: 7px;
  }

  .dashboard-slider-arrow {
    width: 31px;
    height: 31px;
  }

  .dashboard-slider-bar {
    justify-content: center;
  }
}

@media (max-width: 380px) {
  .dashboard-photo-page {
    margin-left: -9px;
    margin-right: -9px;
  }

  .dashboard-glass-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .dashboard-glass-card {
    min-height: 110px !important;
  }

  .dashboard-hero-live {
    display: none;
  }
}


/* Ještě světlejší varianta dashboardu */
.dashboard-glass-label,
.dashboard-glass-card strong,
.dashboard-glass-card small,
.dashboard-hero-kicker,
.dashboard-hero-head p {
  text-shadow: 0 1px 4px rgba(0,0,0,.75);
}

.dashboard-glass-card {
  outline: 1px solid rgba(0,0,0,.08);
}

.dashboard-glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,.08),
    rgba(0,0,0,.02)
  );
}

.dashboard-glass-card {
  position: relative;
  overflow: hidden;
}

.dashboard-glass-card > * {
  position: relative;
  z-index: 1;
}


/* =========================================================
   CM LOGO
========================================================= */
.login-logo {
  overflow: hidden;
  background: #fff !important;
}

.login-logo img {
  width: 90%;
  height: 90%;
  display: block;
  object-fit: contain;
}


/* =========================================================
   PŘEPÍNATELNÝ DARK MODE
========================================================= */
.theme-switch-wrap {
  margin-top: auto;
  padding: 10px 5px 8px;
  border-top: 1px solid #273245;
}

.theme-switch {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 11px;
  background: rgba(255,255,255,.045);
  color: #fff;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}

.theme-switch:hover {
  background: rgba(255,255,255,.08);
}

.theme-switch-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.09);
  font-size: 14px;
}

.theme-switch-copy {
  min-width: 0;
}

.theme-switch-copy strong,
.theme-switch-copy small {
  display: block;
}

.theme-switch-copy strong {
  color: #f8fafc;
  font-size: 10px;
}

.theme-switch-copy small {
  margin-top: 2px;
  color: #8290a6;
  font-size: 7px;
}

.theme-switch-track {
  position: relative;
  width: 34px;
  height: 19px;
  flex: 0 0 34px;
  border-radius: 999px;
  background: #39465a;
  transition: .2s ease;
}

.theme-switch-track.on {
  background: #2563eb;
}

.theme-switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,.24);
  transition: transform .2s ease;
}

.theme-switch-track.on .theme-switch-thumb {
  transform: translateX(15px);
}

.user-box {
  margin-top: 0;
}

.mobile-app-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.mobile-theme-button {
  display: none;
}

/* ---------- DARK: hlavní plochy ---------- */
body.cm-dark {
  background: #080d16;
  color: #e7edf7;
}

.app.dark-mode {
  background: #080d16;
  color: #e7edf7;
}

.app.dark-mode .content {
  background: #0a101b;
  color: #e7edf7;
}

.app.dark-mode .topbar h1,
.app.dark-mode h1,
.app.dark-mode h2,
.app.dark-mode h3,
.app.dark-mode h4,
.app.dark-mode strong {
  color: #f4f7fb;
}

.app.dark-mode .topbar p,
.app.dark-mode .muted {
  color: #8f9bad;
}

/* ---------- DARK: panely, karty, seznamy ---------- */
.app.dark-mode .panel,
.app.dark-mode .stat,
.app.dark-mode .admin-user-stat,
.app.dark-mode .member-summary-bar > div,
.app.dark-mode .member-stat-card,
.app.dark-mode .member-card,
.app.dark-mode .simple-list-item,
.app.dark-mode .notification-card,
.app.dark-mode .course-admin-item,
.app.dark-mode .course-day-section,
.app.dark-mode .assignment-request-card,
.app.dark-mode .vehicle-card,
.app.dark-mode .admin-vehicle-card,
.app.dark-mode .report-card,
.app.dark-mode .user-card,
.app.dark-mode .audit-log-item {
  background: #111927;
  color: #e7edf7;
  border-color: #263245;
  box-shadow: 0 5px 18px rgba(0,0,0,.16);
}

.app.dark-mode .simple-list-item.unread,
.app.dark-mode .notification-card.unread {
  background: #132038;
}

.app.dark-mode .course-day-section {
  background: #0e1724;
}

.app.dark-mode .course-day-section.workday {
  border-left-color: #4d8dff;
}

.app.dark-mode .course-day-section.weekend {
  border-left-color: #f59e0b;
}

/* ---------- DARK: text ---------- */
.app.dark-mode .member-summary-bar span,
.app.dark-mode .member-stat-card span,
.app.dark-mode .member-card-stat span,
.app.dark-mode .member-report-card small,
.app.dark-mode .notification-message,
.app.dark-mode .notification-card small,
.app.dark-mode .audit-log-detail,
.app.dark-mode .audit-log-meta,
.app.dark-mode .audit-log-item time,
.app.dark-mode .course-admin-item span {
  color: #94a2b8;
}

/* ---------- DARK: formuláře ---------- */
.app.dark-mode input,
.app.dark-mode select,
.app.dark-mode textarea {
  background: #0b1320;
  color: #eef3fa;
  border-color: #2a374b;
  color-scheme: dark;
}

.app.dark-mode input::placeholder,
.app.dark-mode textarea::placeholder {
  color: #64748b;
}

.app.dark-mode input:focus,
.app.dark-mode select:focus,
.app.dark-mode textarea:focus {
  border-color: #4d8dff;
  outline-color: #4d8dff;
}

/* ---------- DARK: tabulky ---------- */
.app.dark-mode .data-table,
.app.dark-mode table {
  color: #dce5f2;
}

.app.dark-mode .data-table th,
.app.dark-mode .data-table td,
.app.dark-mode table th,
.app.dark-mode table td {
  border-color: #263245;
}

.app.dark-mode .data-table th,
.app.dark-mode table th {
  background: #111927;
  color: #b8c4d6;
}

/* ---------- DARK: běžná tlačítka / sekundární prvky ---------- */
.app.dark-mode .secondary-button,
.app.dark-mode .logout {
  background: #1b2637;
  color: #e7edf7;
  border-color: #314057;
}

.app.dark-mode .secondary-button:hover {
  background: #243249;
}

.app.dark-mode .empty {
  color: #8190a5;
}

/* ---------- DARK: modaly ---------- */
.app.dark-mode .modal,
.app.dark-mode .modal-card,
.app.dark-mode .departure-modal,
.app.dark-mode .stk-dashboard-modal,
.app.dark-mode .notification-editor,
.app.dark-mode .vehicle-detail-modal {
  background: #101827;
  color: #e7edf7;
  border-color: #2a374b;
}

/* Dashboard s fotografiemi zůstává fotografický */
.app.dark-mode .dashboard-photo-page,
.app.dark-mode .dashboard-photo-hero {
  color: #fff;
}

/* Login / registrace podle body class */
body.cm-dark .auth-card,
body.cm-dark .login-card,
body.cm-dark .register-card {
  background: #111927;
  color: #e7edf7;
  border-color: #263245;
}

body.cm-dark .login-page,
body.cm-dark .register-page,
body.cm-dark .auth-page {
  background: #080d16;
}

body.cm-dark .register-link {
  color: #8fb4ff;
}

/* ---------- MOBIL ---------- */
@media (max-width: 700px) {
  .mobile-theme-button {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid #dfe6ef;
    border-radius: 10px;
    background: #fff;
    color: #172033;
    font-size: 17px;
    cursor: pointer;
  }

  body.cm-dark .mobile-app-bar {
    background: rgba(10,16,27,.97);
    border-bottom-color: #263245;
  }

  body.cm-dark .mobile-app-brand strong {
    color: #f4f7fb;
  }

  body.cm-dark .mobile-app-brand span {
    color: #8492a8;
  }

  body.cm-dark .mobile-theme-button,
  body.cm-dark .mobile-menu-button {
    background: #172233;
    color: #f4f7fb;
    border-color: #2b394e;
  }

  .theme-switch-wrap {
    margin-top: 10px;
  }
}


/* =========================================================
   DARK MODE - VÝPRAVY KOMPLETNĚ TMAVÉ
========================================================= */
.app.dark-mode .departures-toolbar {
  background: #101927 !important;
  border-color: #253247 !important;
}

.app.dark-mode .departures-tabs {
  border-bottom-color: #2a374b !important;
}

.app.dark-mode .departures-branches button {
  background: #162133 !important;
  color: #cbd5e1 !important;
  border-color: #334155 !important;
}

.app.dark-mode .departures-branches button:hover {
  background: #1d2b40 !important;
}

.app.dark-mode .departures-branches button.active {
  background: #2563eb !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
}

.app.dark-mode .departures-selected-branch {
  background: #263245 !important;
  border-color: #263245 !important;
}

.app.dark-mode .departures-selected-branch > div,
.app.dark-mode .departures-selected-branch > div:first-child {
  background: #111927 !important;
}

.app.dark-mode .departures-selected-branch span {
  color: #8290a5 !important;
}

.app.dark-mode .departures-selected-branch strong {
  color: #edf3fb !important;
}

.app.dark-mode .departures-table-wrap {
  background: #0c1421 !important;
  border-color: #2a374b !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.22);
}

.app.dark-mode .departures-month-table {
  background: #0c1421 !important;
  color: #dbe5f2 !important;
}

.app.dark-mode .departures-month-table th,
.app.dark-mode .departures-month-table td {
  border-right-color: #314056 !important;
  border-bottom-color: #314056 !important;
}

.app.dark-mode .departures-month-table thead th {
  background: #151f2f !important;
  color: #94a3b8 !important;
}

.app.dark-mode .departures-month-table thead th strong {
  color: #f1f5f9 !important;
}

/* víkend je stále rozpoznatelný, ale tmavý */
.app.dark-mode .departures-month-table th.weekend,
.app.dark-mode .departures-month-table td.weekend {
  background: #1c1a19 !important;
}

/* dnešní den */
.app.dark-mode .departures-month-table th.today {
  background: #172a4a !important;
  color: #bfdbfe !important;
}

.app.dark-mode .departures-month-table td.today {
  box-shadow:
    inset 2px 0 #3b82f6,
    inset -2px 0 #3b82f6 !important;
}

/* sticky sloupec s vozy */
.app.dark-mode .departures-vehicle-column {
  background: #111927 !important;
  border-right-color: #3a4960 !important;
}

.app.dark-mode thead .departures-vehicle-column {
  background: #172233 !important;
}

.app.dark-mode .departures-vehicle-column strong,
.app.dark-mode .departures-vehicle-column button,
.app.dark-mode .departures-vehicle-link {
  color: #eef4fb !important;
}

.app.dark-mode .departures-vehicle-column small {
  color: #8290a5 !important;
}

/* jednotlivé buňky */
.app.dark-mode .departure-cell {
  background: #0f1724 !important;
  color: #dce6f3 !important;
}

.app.dark-mode .departure-cell.weekend {
  background: #1c1a19 !important;
}

.app.dark-mode .departure-cell.editable:hover {
  background: #182740 !important;
}

.app.dark-mode .departure-cell.filled {
  background: #13243c !important;
}

.app.dark-mode .departure-cell.filled.weekend {
  background: #26231f !important;
}

.app.dark-mode .departure-cell-content strong {
  color: #f1f5f9 !important;
}

.app.dark-mode .departure-cell-content small {
  color: #94a3b8 !important;
}

.app.dark-mode .departure-cell-empty {
  color: #536177 !important;
}

/* kontrola nevypravených */
.app.dark-mode .departure-missing-row td {
  border-top-color: #7f3038 !important;
}

.app.dark-mode .departure-missing-label {
  background: #2a151b !important;
  color: #fda4af !important;
}

.app.dark-mode .departure-missing-label strong {
  color: #fda4af !important;
}

.app.dark-mode .departure-missing-cell.has-missing {
  background: #271419 !important;
}

.app.dark-mode .departure-missing-cell.all-dispatched {
  background: #10251b !important;
}

.app.dark-mode .departure-missing-names span {
  background: rgba(255,255,255,.06) !important;
  color: #fda4af !important;
}

.app.dark-mode .departure-missing-summary {
  background: #21151a !important;
  border-color: #63323a !important;
}

.app.dark-mode .departure-missing-summary > div:first-child strong {
  color: #fda4af !important;
}

.app.dark-mode .departure-missing-summary > div:first-child span {
  color: #c98d95 !important;
}

.app.dark-mode .departure-missing-summary-stats span {
  background: #3a1d24 !important;
  color: #fda4af !important;
}

/* modal Výpravy */
.app.dark-mode .departure-day-type-banner {
  background: #131d2c !important;
  border-color: #2b3a50 !important;
}

.app.dark-mode .departure-day-type-banner span {
  color: #8290a5 !important;
}

.app.dark-mode .departure-day-type-banner strong {
  color: #f1f5f9 !important;
}

.app.dark-mode .departure-course-group {
  background: #111927 !important;
  border-color: #28364a !important;
}

.app.dark-mode .departure-course-group h4 {
  color: #e7edf7 !important;
}

.app.dark-mode .departure-course-picker button {
  background: #172233 !important;
  color: #dce6f3 !important;
  border-color: #314056 !important;
}

.app.dark-mode .departure-course-picker button:hover {
  background: #1f3048 !important;
}

.app.dark-mode .departure-course-picker button.selected,
.app.dark-mode .departure-course-picker button.active {
  background: #1d4ed8 !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
}

.app.dark-mode .departure-modal-actions {
  background: #101827 !important;
  border-top-color: #263245 !important;
}

@media (max-width: 700px) {
  .app.dark-mode .departure-modal-actions {
    background: #101827 !important;
  }
}


/* =========================================================
   DARK MODE V2 - ŽÁDNÉ BÍLÉ PANELY
========================================================= */

/* ---------- ŽÁDOST O PŘIDĚLENÍ VOZIDLA ---------- */
.app.dark-mode .request-user,
.app.dark-mode .request-card,
.app.dark-mode .request-card-main,
.app.dark-mode .request-card-side {
  background: #111927 !important;
  border-color: #29364a !important;
  color: #e7edf7 !important;
  box-shadow: 0 8px 28px rgba(0,0,0,.22) !important;
}

.app.dark-mode .request-hero h1,
.app.dark-mode .request-card-heading h2,
.app.dark-mode .request-field label,
.app.dark-mode .request-vehicle-name,
.app.dark-mode .request-empty-state strong,
.app.dark-mode .request-history-top strong {
  color: #f1f5f9 !important;
}

.app.dark-mode .request-hero p,
.app.dark-mode .request-card-heading p,
.app.dark-mode .request-user small,
.app.dark-mode .request-hint,
.app.dark-mode .request-vehicle-meta,
.app.dark-mode .request-empty-state,
.app.dark-mode .request-empty-state span,
.app.dark-mode .request-history-top small {
  color: #8e9cb0 !important;
}

.app.dark-mode .request-step {
  background: #172a4a !important;
  color: #8fb4ff !important;
}

.app.dark-mode .request-select,
.app.dark-mode .request-textarea {
  background: #091220 !important;
  color: #eef4fb !important;
  border-color: #314056 !important;
}

.app.dark-mode .request-select:focus,
.app.dark-mode .request-textarea:focus {
  background: #0c1726 !important;
  border-color: #4d8dff !important;
}

.app.dark-mode .request-select-arrow {
  color: #8492a8 !important;
}

.app.dark-mode .request-vehicle-preview {
  background: linear-gradient(135deg, #121e30, #0e1827) !important;
  border-color: #2d3d54 !important;
}

.app.dark-mode .request-vehicle-icon {
  background: #172a4a !important;
}

.app.dark-mode .request-history-item {
  background: #0e1724 !important;
  border-color: #28364a !important;
}

.app.dark-mode .request-history-note {
  color: #b7c2d2 !important;
  border-top-color: #29364a !important;
}

.app.dark-mode .request-history-status {
  background: #1d293a !important;
  color: #c3cfdf !important;
}

.app.dark-mode .request-alert-error {
  background: #2a151b !important;
  border-color: #65323a !important;
  color: #fda4af !important;
}

.app.dark-mode .request-alert-success {
  background: #10251b !important;
  border-color: #27583d !important;
  color: #86efac !important;
}

/* ---------- NOTIFIKACE - ODESÍLACÍ FORMULÁŘ ---------- */
.app.dark-mode .notification-compose-card {
  background: #111927 !important;
  border-color: #29364a !important;
  box-shadow: 0 10px 28px rgba(0,0,0,.22) !important;
}

.app.dark-mode .notification-compose-heading h2,
.app.dark-mode .notification-field label,
.app.dark-mode .notification-upload-top strong,
.app.dark-mode .notification-confirm-switch strong {
  color: #f1f5f9 !important;
}

.app.dark-mode .notification-compose-heading p,
.app.dark-mode .notification-upload-top span,
.app.dark-mode .notification-confirm-switch small,
.app.dark-mode .notification-section-heading p {
  color: #8e9cb0 !important;
}

.app.dark-mode .notification-compose-icon {
  background: #172a4a !important;
}

.app.dark-mode .notification-field input,
.app.dark-mode .notification-field select,
.app.dark-mode .notification-field textarea {
  background: #091220 !important;
  color: #eef4fb !important;
  border-color: #314056 !important;
}

.app.dark-mode .notification-field input:focus,
.app.dark-mode .notification-field select:focus,
.app.dark-mode .notification-field textarea:focus {
  background: #0c1726 !important;
  border-color: #4d8dff !important;
}

.app.dark-mode .notification-confirm-switch,
.app.dark-mode .notification-upload-box,
.app.dark-mode .notification-edit-box {
  background: #0e1724 !important;
  border-color: #2c3a4f !important;
}

.app.dark-mode .notification-file-button {
  background: #172233 !important;
  color: #e7edf7 !important;
  border-color: #35445a !important;
}

.app.dark-mode .notification-image-preview {
  background: #0b1320 !important;
  border-color: #2b394d !important;
}

.app.dark-mode .notification-admin-actions,
.app.dark-mode .notification-edit-actions,
.app.dark-mode .notification-confirm-area {
  border-top-color: #29364a !important;
}

.app.dark-mode .notification-card {
  background: #111927 !important;
  border-color: #29364a !important;
}

.app.dark-mode .notification-card.unread {
  background: linear-gradient(135deg, #13223a, #101927) !important;
}

/* ---------- ADMIN - ŽÁDOSTI O PŘIDĚLENÍ ---------- */
.app.dark-mode .assignment-admin-card {
  background: #111927 !important;
  border-color: #29364a !important;
  box-shadow: 0 10px 30px rgba(0,0,0,.23) !important;
}

.app.dark-mode .assignment-admin-card-head {
  background: linear-gradient(135deg, #141f30 0%, #101927 100%) !important;
  border-bottom-color: #29364a !important;
}

.app.dark-mode .assignment-admin-bus-icon {
  background: #172a4a !important;
}

.app.dark-mode .assignment-admin-title h3,
.app.dark-mode .assignment-admin-info strong,
.app.dark-mode .assignment-admin-note p,
.app.dark-mode .assignment-admin-empty strong {
  color: #eef4fb !important;
}

.app.dark-mode .assignment-admin-title > span,
.app.dark-mode .assignment-admin-title p,
.app.dark-mode .assignment-admin-info span,
.app.dark-mode .assignment-admin-note > span,
.app.dark-mode .assignment-admin-status-control label {
  color: #8e9cb0 !important;
}

.app.dark-mode .assignment-admin-info-grid {
  background: #29364a !important;
  border-bottom-color: #29364a !important;
}

.app.dark-mode .assignment-admin-info {
  background: #0f1826 !important;
}

.app.dark-mode .assignment-admin-note {
  background: #0d1623 !important;
  border-color: #29364a !important;
}

.app.dark-mode .assignment-status-select {
  background: #091220 !important;
  color: #eef4fb !important;
  border-color: #314056 !important;
}

.app.dark-mode .assignment-admin-empty {
  background: #111927 !important;
  color: #8e9cb0 !important;
  border-color: #29364a !important;
}

.app.dark-mode .assignment-delete-button {
  background: #2a151b !important;
  color: #fda4af !important;
  border-color: #65323a !important;
}

.app.dark-mode .assignment-delete-button:hover:not(:disabled) {
  background: #371a21 !important;
}

/* ---------- KURZY ---------- */
.app.dark-mode .course-admin-item.inactive {
  background: #0d1521 !important;
}

.app.dark-mode .course-admin-item > div:first-child strong {
  color: #eef4fb !important;
}

.app.dark-mode .course-active-badge.inactive {
  background: #263245 !important;
  color: #a8b5c7 !important;
}

/* ---------- STK MODAL ---------- */
.app.dark-mode .stk-dashboard-modal {
  background: #101827 !important;
  color: #e7edf7 !important;
}

.app.dark-mode .stk-dashboard-modal-head h2 {
  color: #f1f5f9 !important;
}

.app.dark-mode .stk-dashboard-modal-head p {
  color: #8e9cb0 !important;
}

.app.dark-mode .stk-dashboard-modal-close {
  background: #172233 !important;
  color: #cbd5e1 !important;
  border-color: #35445a !important;
}

.app.dark-mode .stk-dashboard-item {
  background: #111927 !important;
  border-color: #29364a !important;
  color: #e7edf7 !important;
}

.app.dark-mode .stk-dashboard-item:hover {
  background: #16243a !important;
  border-color: #4d8dff !important;
}

.app.dark-mode .stk-dashboard-vehicle strong,
.app.dark-mode .stk-dashboard-date strong {
  color: #eef4fb !important;
}

.app.dark-mode .stk-dashboard-vehicle span,
.app.dark-mode .stk-dashboard-vehicle small,
.app.dark-mode .stk-dashboard-date span,
.app.dark-mode .stk-dashboard-date small {
  color: #8e9cb0 !important;
}

/* ---------- OBECNÉ BÍLÉ PLOCHY UVNITŘ DARK REŽIMU ---------- */
.app.dark-mode .search,
.app.dark-mode .course-admin-filters,
.app.dark-mode .vehicle-extra-panel {
  border-color: #29364a !important;
}

.app.dark-mode hr {
  border-color: #29364a !important;
}

/* scrollbary */
body.cm-dark * {
  scrollbar-color: #334155 #0b1320;
}

body.cm-dark *::-webkit-scrollbar-track {
  background: #0b1320;
}

body.cm-dark *::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 999px;
}

/* mobilní spodní modaly a sticky akce */
@media (max-width: 700px) {
  .app.dark-mode .request-card,
  .app.dark-mode .notification-compose-card,
  .app.dark-mode .assignment-admin-card {
    background: #111927 !important;
  }
}


/* =========================================================
   DARK MODE V3 - DETAIL VOZU + VÝKAZY
========================================================= */

/* ---------- DETAIL VOZU ---------- */
.app.dark-mode .vehicle-detail-field-card {
  background: #0f1826 !important;
  border-color: #2b394d !important;
  color: #eef4fb !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
}

.app.dark-mode .vehicle-detail-field-label {
  color: #8e9cb0 !important;
}

.app.dark-mode .vehicle-detail-field-card > div:not(.vehicle-detail-field-label):not(.stk-status-note) {
  color: #eef4fb !important;
}

.app.dark-mode .vehicle-detail-note {
  background: #0d1623 !important;
  color: #8e9cb0 !important;
  border: 1px solid #29364a !important;
}

.app.dark-mode .vehicle-detail-note strong {
  color: #c9d5e5 !important;
}

.app.dark-mode .vehicle-extra-panel {
  border-top-color: #29364a !important;
}

.app.dark-mode .vehicle-extra-panel h2 {
  color: #f1f5f9 !important;
}

/* ---------- FORMULÁŘE VÝKAZŮ / OBECNÉ CRUD FORMULÁŘE ---------- */
.app.dark-mode .crud-form,
.app.dark-mode .user-create-box {
  background: #0f1826 !important;
  color: #e7edf7 !important;
  border-color: #29364a !important;
  box-shadow: 0 7px 22px rgba(0,0,0,.16);
}

.app.dark-mode .crud-form h3,
.app.dark-mode .user-create-box h3,
.app.dark-mode .crud-form label,
.app.dark-mode .user-create-box label {
  color: #eef4fb !important;
}

.app.dark-mode .crud-form .form-grid input,
.app.dark-mode .crud-form .form-grid select,
.app.dark-mode .crud-form .form-grid textarea,
.app.dark-mode .user-create-box .form-grid input,
.app.dark-mode .user-create-box .form-grid select,
.app.dark-mode .user-create-box .form-grid textarea {
  background: #091220 !important;
  color: #eef4fb !important;
  border-color: #314056 !important;
}

.app.dark-mode .crud-form .form-grid input::placeholder,
.app.dark-mode .crud-form .form-grid textarea::placeholder,
.app.dark-mode .user-create-box .form-grid input::placeholder,
.app.dark-mode .user-create-box .form-grid textarea::placeholder {
  color: #64748b !important;
}

.app.dark-mode .crud-form .form-grid input:focus,
.app.dark-mode .crud-form .form-grid select:focus,
.app.dark-mode .crud-form .form-grid textarea:focus,
.app.dark-mode .user-create-box .form-grid input:focus,
.app.dark-mode .user-create-box .form-grid select:focus,
.app.dark-mode .user-create-box .form-grid textarea:focus {
  background: #0c1726 !important;
  border-color: #4d8dff !important;
}

.app.dark-mode .crud-form select:disabled,
.app.dark-mode .crud-form input:disabled,
.app.dark-mode .user-create-box select:disabled,
.app.dark-mode .user-create-box input:disabled {
  background: #17202d !important;
  color: #6f7d91 !important;
  border-color: #29364a !important;
  opacity: 1 !important;
}

/* report panel pod formulářem */
.app.dark-mode .report-list,
.app.dark-mode .reports-list {
  color: #e7edf7 !important;
}

.app.dark-mode .report-card {
  background: #111927 !important;
  border-color: #29364a !important;
}

.app.dark-mode .report-card small {
  color: #8e9cb0 !important;
}

.app.dark-mode .report-card strong {
  color: #eef4fb !important;
}

@media (max-width: 700px) {
  .app.dark-mode .vehicle-detail-field-card,
  .app.dark-mode .crud-form {
    background: #0f1826 !important;
  }
}


/* =========================================================
   DARK MODE V4 - SEZNAM VOZŮ
========================================================= */
.app.dark-mode .vehicle-header {
  background: #172233 !important;
  color: #9eabc0 !important;
  border: 1px solid #2b394d !important;
}

.app.dark-mode .vehicle-header span {
  color: #aebbd0 !important;
}

.app.dark-mode .vehicle-row {
  background: #111927 !important;
  color: #dfe8f5 !important;
  border-bottom-color: #2a374b !important;
}

.app.dark-mode .vehicle-row-clickable {
  background: #111927 !important;
  color: #dfe8f5 !important;
}

.app.dark-mode .vehicle-row-clickable:hover {
  background: #18263a !important;
  box-shadow: inset 3px 0 #3b82f6 !important;
}

.app.dark-mode .vehicle-row-clickable:focus {
  background: #18263a !important;
  outline-color: #4d8dff !important;
}

.app.dark-mode .vehicle-row span,
.app.dark-mode .vehicle-row strong {
  color: #dfe8f5;
}

.app.dark-mode .vehicle-row > span:first-child,
.app.dark-mode .vehicle-row > strong:first-child {
  color: #8fb4ff !important;
}

.app.dark-mode .vehicles-list,
.app.dark-mode .vehicle-list {
  background: transparent !important;
}

@media (max-width: 700px) {
  .app.dark-mode .vehicle-row {
    background: #111927 !important;
    border-color: #2b394d !important;
  }

  .app.dark-mode .vehicle-row-clickable:hover,
  .app.dark-mode .vehicle-row-clickable:focus {
    background: #18263a !important;
  }
}


/* =========================================================
   AUTOMATICKÉ ULOŽENÍ ROZEPSANÝCH ÚPRAV VOZU
========================================================= */
.vehicle-draft-info {
  margin-bottom: 12px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 10px;
  font-weight: 700;
}

.vehicle-draft-info span {
  color: #2563eb;
  font-size: 9px;
}

.app.dark-mode .vehicle-draft-info {
  background: #10213d;
  color: #bfdbfe;
  border-color: #294c7c;
}

.app.dark-mode .vehicle-draft-info span {
  color: #60a5fa;
}


/* =========================================================
   TURNUSY 400 - PŘESNÉ DNY PROVOZU
========================================================= */
.course-day-section.sunday {
  border-left: 4px solid #8b5cf6;
}

.course-day-section.daily {
  border-left: 4px solid #10b981;
}

.course-day-section.sunday .course-day-chip {
  background: #ede9fe;
  color: #6d28d9;
}

.course-day-section.daily .course-day-chip {
  background: #d1fae5;
  color: #047857;
}

.departure-course-day {
  display: block;
  margin-top: 3px;
  font-size: 7px;
  font-weight: 800;
  color: #64748b;
}

.app.dark-mode .course-day-section.sunday .course-day-chip {
  background: #2e1f4f;
  color: #c4b5fd;
}

.app.dark-mode .course-day-section.daily .course-day-chip {
  background: #123629;
  color: #6ee7b7;
}

.app.dark-mode .departure-course-day {
  color: #8fa0b7;
}


/* =========================================================
   VÝPRAVY - VÍCE KURZŮ NA JEDEN VŮZ / DEN
========================================================= */
.departure-cell-course-list {
  width: 100%;
  min-height: 100%;
  padding: 3px 2px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 2px;
}

.departure-cell-course-tag {
  display: block;
  width: 100%;
  padding: 3px 2px;
  border-radius: 5px;
  background: #e8f0ff;
  color: #174ea6;
  font-size: 7px;
  font-weight: 900;
  line-height: 1.05;
  text-align: center;
  overflow-wrap: anywhere;
}

.departure-cell.multi {
  vertical-align: middle;
}

.departure-multi-summary {
  margin: 0 0 10px;
  padding: 8px 10px;
  border: 1px solid #dbe5f2;
  border-radius: 9px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  gap: 7px;
}

.departure-multi-summary strong {
  width: 25px;
  height: 25px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
}

.departure-multi-summary span {
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
}

.departure-course-picker button.active {
  position: relative;
}

.departure-course-picker button.active::after {
  content: "✓";
  position: absolute;
  top: 5px;
  right: 6px;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255,255,255,.20);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.app.dark-mode .departure-cell-course-tag {
  background: #183253 !important;
  color: #bfdbfe !important;
  border: 1px solid #294b75;
}

.app.dark-mode .departure-multi-summary {
  background: #0d1725;
  border-color: #2b394d;
}

.app.dark-mode .departure-multi-summary span {
  color: #9aa8bc;
}

@media (max-width: 700px) {
  .departure-cell-course-list {
    gap: 1px;
    padding: 2px 1px;
  }

  .departure-cell-course-tag {
    padding: 2px 1px;
    font-size: 6px;
    border-radius: 4px;
  }
}


/* =========================================================
   DETAIL TURNUSE - SPOJE A ČASY
========================================================= */
.departure-course-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  border: 1px solid #d9e2ef;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
  transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
}

.departure-course-card:hover {
  border-color: #9ebff8;
  box-shadow: 0 4px 14px rgba(37,99,235,.09);
}

.departure-course-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.departure-course-picker .departure-course-select {
  width: 34px !important;
  min-width: 34px !important;
  height: 100% !important;
  min-height: 58px !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  border-right: 1px solid #d9e2ef !important;
  border-radius: 0 !important;
  background: #f5f8fc !important;
  color: #2563eb !important;
  display: grid !important;
  place-items: center !important;
  font-size: 18px !important;
  font-weight: 900 !important;
  cursor: pointer;
}

.departure-course-card.active .departure-course-select {
  background: #2563eb !important;
  color: #fff !important;
  border-right-color: #2563eb !important;
}

.departure-course-picker .departure-course-detail-button {
  width: 100% !important;
  min-width: 0 !important;
  min-height: 58px !important;
  padding: 9px 10px !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #172033 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  text-align: left !important;
  cursor: pointer;
}

.departure-course-detail-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.departure-course-detail-copy strong {
  color: inherit;
}

.departure-course-detail-link {
  flex: 0 0 auto;
  color: #2563eb;
  font-size: 8px;
  font-weight: 900;
  white-space: nowrap;
}

.turnus-detail-backdrop {
  z-index: 3200 !important;
}

.turnus-detail-modal {
  width: min(1000px, calc(100vw - 32px));
  max-height: min(86vh, 820px);
  padding: 20px;
  border-radius: 18px;
  background: #fff;
  color: #172033;
  box-shadow: 0 30px 90px rgba(0,0,0,.30);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.turnus-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}

.turnus-detail-kicker {
  display: block;
  margin-bottom: 5px;
  color: #2563eb;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .12em;
}

.turnus-detail-head h2 {
  margin: 0;
  font-size: 25px;
}

.turnus-detail-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
}

.turnus-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.turnus-detail-summary > div {
  padding: 9px 11px;
  border: 1px solid #e0e7f0;
  border-radius: 10px;
  background: #f8fafc;
}

.turnus-detail-summary span,
.turnus-detail-summary strong {
  display: block;
}

.turnus-detail-summary span {
  color: #64748b;
  font-size: 8px;
  font-weight: 800;
}

.turnus-detail-summary strong {
  margin-top: 2px;
  color: #172033;
  font-size: 14px;
}

.turnus-spoje-wrap {
  min-height: 0;
  overflow: auto;
  border: 1px solid #dbe3ee;
  border-radius: 11px;
}

.turnus-spoje-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
}

.turnus-spoje-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 9px 10px;
  background: #eef3f9;
  color: #64748b;
  text-align: left;
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.turnus-spoje-table td {
  padding: 9px 10px;
  border-top: 1px solid #e6ebf2;
  color: #334155;
  vertical-align: middle;
}

.turnus-spoje-table tbody tr:hover {
  background: #f8fbff;
}

.turnus-spoje-table td:first-child strong {
  color: #1d4ed8;
  white-space: nowrap;
}

.turnus-time {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
  color: #0f172a !important;
  white-space: nowrap;
}

.turnus-detail-loading,
.turnus-detail-empty {
  padding: 30px 16px;
  border: 1px dashed #ccd7e5;
  border-radius: 11px;
  color: #64748b;
  text-align: center;
  font-size: 10px;
}

.turnus-detail-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.turnus-selected-button {
  background: #15803d !important;
}

/* Dark mode */
.app.dark-mode .departure-course-card {
  background: #101927;
  border-color: #2b394d;
}

.app.dark-mode .departure-course-card:hover {
  border-color: #4d78b8;
}

.app.dark-mode .departure-course-card.active {
  background: #13243c;
  border-color: #3b82f6;
}

.app.dark-mode .departure-course-picker .departure-course-select {
  background: #172233 !important;
  color: #93c5fd !important;
  border-right-color: #2b394d !important;
}

.app.dark-mode .departure-course-card.active .departure-course-select {
  background: #2563eb !important;
  color: #fff !important;
}

.app.dark-mode .departure-course-picker .departure-course-detail-button {
  color: #e8eef7 !important;
}

.app.dark-mode .departure-course-detail-link {
  color: #93c5fd;
}

.app.dark-mode .turnus-detail-modal {
  background: #0f1826;
  color: #e7edf7;
  border: 1px solid #29364a;
}

.app.dark-mode .turnus-detail-head h2,
.app.dark-mode .turnus-detail-summary strong {
  color: #f1f5f9;
}

.app.dark-mode .turnus-detail-head p,
.app.dark-mode .turnus-detail-summary span {
  color: #8e9cb0;
}

.app.dark-mode .turnus-detail-summary > div {
  background: #111d2c;
  border-color: #2a394d;
}

.app.dark-mode .turnus-spoje-wrap {
  border-color: #2a394d;
}

.app.dark-mode .turnus-spoje-table th {
  background: #172233 !important;
  color: #9aa8bc !important;
  border-color: #2b394d !important;
}

.app.dark-mode .turnus-spoje-table td {
  background: #0f1826 !important;
  color: #cbd5e1 !important;
  border-color: #28364a !important;
}

.app.dark-mode .turnus-spoje-table tbody tr:hover td {
  background: #15243a !important;
}

.app.dark-mode .turnus-spoje-table td:first-child strong {
  color: #93c5fd !important;
}

.app.dark-mode .turnus-time {
  color: #f1f5f9 !important;
}

.app.dark-mode .turnus-detail-loading,
.app.dark-mode .turnus-detail-empty {
  border-color: #334155;
  color: #8e9cb0;
  background: #0d1623;
}

@media (max-width: 700px) {
  .departure-course-picker {
    grid-template-columns: 1fr !important;
  }

  .turnus-detail-backdrop {
    align-items: flex-end !important;
    padding: 0 !important;
  }

  .turnus-detail-modal {
    width: 100%;
    max-height: 92dvh;
    padding: 14px 12px max(14px, env(safe-area-inset-bottom));
    border-radius: 18px 18px 0 0;
  }

  .turnus-detail-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .turnus-spoje-table {
    min-width: 660px;
  }

  .turnus-detail-actions {
    position: sticky;
    bottom: 0;
    padding-top: 10px;
    background: inherit;
  }

  .turnus-detail-actions button {
    min-height: 44px;
  }
}


/* =========================================================
   VÝPRAVY - ZAMĚSTNANEC ROZKLIKNE PŘIŘAZENÝ TURNUS
========================================================= */
.departure-cell-course-link {
  appearance: none;
  border: 1px solid rgba(37,99,235,.18);
  cursor: pointer;
  font-family: inherit;
  transition:
    transform .15s ease,
    border-color .15s ease,
    box-shadow .15s ease,
    background .15s ease;
}

.departure-cell-course-link:hover {
  transform: translateY(-1px);
  border-color: #60a5fa;
  background: #dbeafe;
  box-shadow: 0 3px 9px rgba(37,99,235,.12);
}

.departure-cell-course-link:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
}

.departure-cell-course-link > span {
  display: block;
  font: inherit;
  font-weight: 900;
}

.departure-cell-course-link > small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 5.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.app.dark-mode .departure-cell-course-link {
  border-color: #294b75 !important;
}

.app.dark-mode .departure-cell-course-link:hover {
  background: #204064 !important;
  border-color: #60a5fa !important;
}

.app.dark-mode .departure-cell-course-link > small {
  color: #93a8c2 !important;
}

@media (max-width: 700px) {
  .departure-cell-course-link > small {
    font-size: 5px;
  }
}

`;

export default App;
