```jsx
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
        .eq("email", email.trim().toLowerCase())
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

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
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
      await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          jmeno: invite.jmeno || name.trim(),
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
   STAVY VOZIDEL
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
      className="status"
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
   ADMINISTRACE VOZŮ
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

function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyVehicle);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  async function loadVehicles() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
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

  function changeForm(e) {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyVehicle);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(vehicle) {
    setEditingId(vehicle.id);

    setForm({
      cislo: vehicle.cislo ?? "",
      vyrobce: vehicle.vyrobce ?? "",
      typ: vehicle.typ ?? "",
      spz: vehicle.spz ?? "",
      rok: vehicle.rok ?? "",
      barevne_schema:
        vehicle.barevne_schema ?? "",
      stav: vehicle.stav ?? "PROVOZNÍ",
      provozovna_id:
        vehicle.provozovna_id ?? "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyVehicle);
  }

  async function saveVehicle(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const vehicleData = {
      cislo: form.cislo
        ? Number(form.cislo)
        : null,

      vyrobce:
        form.vyrobce.trim() || null,

      typ:
        form.typ.trim() || null,

      spz:
        form.spz.trim() || null,

      rok: form.rok
        ? Number(form.rok)
        : null,

      barevne_schema:
        form.barevne_schema.trim() || null,

      stav:
        form.stav || "PROVOZNÍ",

      provozovna_id:
        form.provozovna_id
          ? Number(form.provozovna_id)
          : null,
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
        .insert(vehicleData);
    }

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      editingId
        ? "Vůz byl upraven."
        : "Vůz byl přidán."
    );

    cancelForm();
    await loadVehicles();

    setSaving(false);
  }

  async function deleteVehicle(id) {
    if (
      !window.confirm(
        "Opravdu chceš tento vůz smazat?"
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } =
      await supabase
        .from("vozy")
        .delete()
        .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Vůz byl smazán.");

    await loadVehicles();
  }

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
          (x) =>
            x !== null &&
            x !== undefined
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
          <h1>Administrace vozů</h1>
          <p>
            Správa vozového parku Czech Mobility
          </p>
        </div>

        <div className="profile-badge">
          {vehicles.length} VOZŮ
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
            <h2>Vozový park</h2>

            <p className="muted">
              Přidávání, úprava a mazání vozů.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={startCreate}
          >
            ➕ Přidat vůz
          </button>
        </div>

        {showForm && (
          <div className="user-create-box">
            <h3>
              {editingId
                ? "✏️ Upravit vůz"
                : "➕ Přidat vůz"}
            </h3>

            <form onSubmit={saveVehicle}>
              <div className="form-grid">
                <div>
                  <label>Číslo vozu</label>
                  <input
                    name="cislo"
                    type="number"
                    value={form.cislo}
                    onChange={changeForm}
                    required
                  />
                </div>

                <div>
                  <label>Výrobce</label>
                  <input
                    name="vyrobce"
                    value={form.vyrobce}
                    onChange={changeForm}
                    placeholder="SOR"
                  />
                </div>

                <div>
                  <label>Typ</label>
                  <input
                    name="typ"
                    value={form.typ}
                    onChange={changeForm}
                    placeholder="NB 12"
                  />
                </div>

                <div>
                  <label>SPZ</label>
                  <input
                    name="spz"
                    value={form.spz}
                    onChange={changeForm}
                    placeholder="1H2 3456"
                  />
                </div>

                <div>
                  <label>Rok</label>
                  <input
                    name="rok"
                    type="number"
                    value={form.rok}
                    onChange={changeForm}
                    placeholder="2026"
                  />
                </div>

                <div>
                  <label>Barevné schéma</label>
                  <input
                    name="barevne_schema"
                    value={form.barevne_schema}
                    onChange={changeForm}
                    placeholder="Czech Mobility"
                  />
                </div>

                <div>
                  <label>Stav</label>

                  <select
                    name="stav"
                    value={form.stav}
                    onChange={changeForm}
                  >
                    <option>
                      PROVOZNÍ
                    </option>

                    <option>
                      V DÍLNĚ / V OPRAVĚ
                    </option>

                    <option>
                      DOČASNĚ ODSTAVEN
                    </option>

                    <option>
                      DLOUHODOBĚ ODSTAVEN
                    </option>

                    <option>
                      DLOUHODOBĚ/ DEFINITIVNĚ ODSTAVEN
                    </option>

                    <option>
                      DOSUD NEZAŘAZEN DO PROVOZU
                    </option>

                    <option>
                      SLUŽEBNÍ
                    </option>

                    <option>
                      RETRO
                    </option>

                    <option>
                      SEŠROTOVÁN
                    </option>

                    <option>
                      PRODÁN / PŘEDÁN JINÉMU DOPRAVCI
                    </option>
                  </select>
                </div>

                <div>
                  <label>
                    ID provozovny
                  </label>

                  <input
                    name="provozovna_id"
                    type="number"
                    value={form.provozovna_id}
                    onChange={changeForm}
                    placeholder="1"
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
                    ? "✓ Uložit změny"
                    : "✓ Přidat vůz"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelForm}
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        )}

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

        {!loading &&
          filteredVehicles.length === 0 && (
            <div className="empty">
              Žádné vozy.
            </div>
          )}

        {!loading &&
          filteredVehicles.length > 0 && (
            <div className="vehicle-admin-list">
              {filteredVehicles.map(
                (vehicle) => (
                  <div
                    className="vehicle-admin-card"
                    key={vehicle.id}
                  >
                    <div className="vehicle-number">
                      {vehicle.cislo}
                    </div>

                    <div className="vehicle-info">
                      <strong>
                        {vehicle.vyrobce || "-"}{" "}
                        {vehicle.typ || ""}
                      </strong>

                      <small>
                        SPZ: {vehicle.spz || "-"}{" "}
                        • Rok: {vehicle.rok || "-"}
                      </small>

                      <small>
                        Schéma:{" "}
                        {vehicle.barevne_schema ||
                          "-"}
                      </small>
                    </div>

                    <VehicleStatus
                      status={vehicle.stav}
                    />

                    <div className="vehicle-actions">
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
                            vehicle.id
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
   VOZY PRO BĚŽNÉ UŽIVATELE
========================================================= */

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
          (x) =>
            x !== null &&
            x !== undefined
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
          <p>
            Vozový park Czech Mobility
          </p>
        </div>

        <div className="profile-badge">
          {vehicles.length} VOZŮ
        </div>
      </div>

      <div className="panel">
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
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredVehicles.map(
            (vehicle) => (
              <div
                className="vehicle-row"
                key={vehicle.id}
              >
                <strong>
                  {vehicle.cislo}
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

                <VehicleStatus
                  status={vehicle.stav}
                />
              </div>
            )
          )}

        {!loading &&
          !error &&
          filteredVehicles.length === 0 && (
            <div className="empty">
              Žádné vozy.
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
  datum: "",
  linka: "",
  smer: "",
  vuz: "",
  zacatek: "",
  konec: "",
};

function ReportForm({
  initial,
  onSave,
  onCancel,
  saving,
}) {
  const [form, setForm] =
    useState(initial || emptyReport);

  useEffect(() => {
    setForm(initial || emptyReport);
  }, [initial]);

  function change(e) {
    const { name, value } = e.target;

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
    <div className="user-create-box">
      <h3>
        {initial?.id
          ? "✏️ Upravit výkaz"
          : "➕ Přidat výkaz"}
      </h3>

      <form onSubmit={submit}>
        <div className="form-grid">
          <div>
            <label>Datum</label>

            <input
              type="date"
              name="datum"
              value={form.datum}
              onChange={change}
              required
            />
          </div>

          <div>
            <label>Linka</label>

            <input
              name="linka"
              value={form.linka}
              onChange={change}
              placeholder="Např. 15"
              required
            />
          </div>

          <div>
            <label>Směr</label>

            <input
              name="smer"
              value={form.smer}
              onChange={change}
              placeholder="Např. Terminál HD → Pod Strání"
            />
          </div>

          <div>
            <label>Vůz</label>

            <input
              name="vuz"
              value={form.vuz}
              onChange={change}
              placeholder="Např. 42"
              required
            />
          </div>

          <div>
            <label>Začátek</label>

            <input
              type="time"
              name="zacatek"
              value={form.zacatek}
              onChange={change}
              required
            />
          </div>

          <div>
            <label>Konec</label>

            <input
              type="time"
              name="konec"
              value={form.konec}
              onChange={change}
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
            {saving
              ? "Ukládání..."
              : initial?.id
              ? "✓ Uložit změny"
              : "✓ Přidat výkaz"}
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
   MOJE VÝKAZY
========================================================= */

function MyReports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  async function loadReports() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("vykazy")
        .select(
          "id, uzivatel_id, datum, linka, smer, vuz, zacatek, konec"
        )
        .eq("uzivatel_id", user.id)
        .order("datum", {
          ascending: false,
        })
        .order("zacatek", {
          ascending: false,
        });

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

  async function saveReport(form) {
    setSaving(true);
    setError("");
    setSuccess("");

    const data = {
      datum: form.datum,
      linka: form.linka.trim(),
      smer: form.smer.trim(),
      vuz: form.vuz.trim(),
      zacatek: form.zacatek,
      konec: form.konec,
      uzivatel_id: user.id,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("vykazy")
        .update(data)
        .eq("id", editing.id)
        .eq("uzivatel_id", user.id);
    } else {
      result = await supabase
        .from("vykazy")
        .insert(data);
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

    await loadReports();

    setSaving(false);
  }

  async function deleteReport(id) {
    if (
      !window.confirm(
        "Opravdu chceš tento výkaz smazat?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("vykazy")
        .delete()
        .eq("id", id)
        .eq("uzivatel_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Výkaz byl smazán.");

    await loadReports();
  }

  function editReport(report) {
    setEditing(report);
    setShowForm(true);
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Moje výkazy</h1>
          <p>
            Výkazy přihlášeného uživatele
          </p>
        </div>

        <div className="profile-badge">
          {reports.length} VÝKAZŮ
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
            <h2>Moje výkazy</h2>

            <p className="muted">
              Zde vidíš pouze svoje výkazy.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            ➕ Přidat výkaz
          </button>
        </div>

        {showForm && (
          <ReportForm
            initial={
              editing || emptyReport
            }
            onSave={saveReport}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        )}

        {loading && (
          <div className="empty">
            Načítání výkazů...
          </div>
        )}

        {!loading &&
          reports.length === 0 && (
            <div className="empty">
              Zatím nemáš žádné výkazy.
            </div>
          )}

        {!loading &&
          reports.length > 0 && (
            <div className="reports-list">
              {reports.map((report) => (
                <div
                  className="report-card"
                  key={report.id}
                >
                  <div className="report-date">
                    {new Date(
                      `${report.datum}T00:00:00`
                    ).toLocaleDateString(
                      "cs-CZ"
                    )}
                  </div>

                  <div>
                    <strong>
                      Linka {report.linka}
                    </strong>

                    <small>
                      {report.smer || "-"}
                    </small>
                  </div>

                  <div>
                    <small>Vůz</small>
                    <strong>
                      {report.vuz}
                    </strong>
                  </div>

                  <div>
                    <small>Čas</small>
                    <strong>
                      {String(
                        report.zacatek
                      ).slice(0, 5)}
                      {" – "}
                      {String(
                        report.konec
                      ).slice(0, 5)}
                    </strong>
                  </div>

                  <div className="report-actions">
                    <button
                      className="edit-button"
                      onClick={() =>
                        editReport(
                          report
                        )
                      }
                    >
                      ✏️
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteReport(
                          report.id
                        )
                      }
                    >
                      🗑️
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
   SPRÁVA VÝKAZŮ
========================================================= */

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [filterUser, setFilterUser] =
    useState("all");

  async function loadData() {
    setLoading(true);
    setError("");

    const reportsResult =
      await supabase
        .from("vykazy")
        .select(
          "id, uzivatel_id, datum, linka, smer, vuz, zacatek, konec"
        )
        .order("datum", {
          ascending: false,
        })
        .order("zacatek", {
          ascending: false,
        });

    if (reportsResult.error) {
      setError(
        reportsResult.error.message
      );
    } else {
      setReports(
        reportsResult.data || []
      );
    }

    const profilesResult =
      await supabase
        .from("profiles")
        .select(
          "id, jmeno, role"
        )
        .order("jmeno", {
          ascending: true,
        });

    if (!profilesResult.error) {
      setProfiles(
        profilesResult.data || []
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getUserName(id) {
    const user =
      profiles.find(
        (p) => p.id === id
      );

    return (
      user?.jmeno ||
      id ||
      "Neznámý uživatel"
    );
  }

  function getFormInitial(report) {
    if (!report) {
      return {
        ...emptyReport,
        uzivatel_id: "",
      };
    }

    return {
      ...report,
      uzivatel_id:
        report.uzivatel_id,
    };
  }

  async function saveReport(form) {
    setSaving(true);
    setError("");
    setSuccess("");

    if (
      !form.uzivatel_id
    ) {
      setError(
        "Vyber řidiče."
      );
      setSaving(false);
      return;
    }

    const data = {
      uzivatel_id:
        form.uzivatel_id,
      datum: form.datum,
      linka:
        form.linka.trim(),
      smer:
        form.smer.trim(),
      vuz:
        form.vuz.trim(),
      zacatek:
        form.zacatek,
      konec:
        form.konec,
    };

    let result;

    if (editing) {
      result = await supabase
        .from("vykazy")
        .update(data)
        .eq("id", editing.id);
    } else {
      result = await supabase
        .from("vykazy")
        .insert(data);
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

    await loadData();

    setSaving(false);
  }

  async function deleteReport(id) {
    if (
      !window.confirm(
        "Opravdu chceš tento výkaz smazat?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("vykazy")
        .delete()
        .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Výkaz byl smazán.");

    await loadData();
  }

  const filteredReports =
    reports.filter((report) => {
      if (
        filterUser === "all"
      ) {
        return true;
      }

      return (
        report.uzivatel_id ===
        filterUser
      );
    });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Správa výkazů</h1>

          <p>
            Administrace výkazů řidičů
          </p>
        </div>

        <div className="profile-badge">
          {reports.length} VÝKAZŮ
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
            <h2>
              Všechny výkazy
            </h2>

            <p className="muted">
              Zde jsou výkazy všech řidičů.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            ➕ Přidat výkaz
          </button>
        </div>

        {showForm && (
          <div className="user-create-box">
            <h3>
              {editing
                ? "✏️ Upravit výkaz"
                : "➕ Přidat výkaz"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();

                const form =
                  new FormData(
                    e.currentTarget
                  );

                saveReport({
                  uzivatel_id:
                    form.get(
                      "uzivatel_id"
                    ),
                  datum:
                    form.get(
                      "datum"
                    ),
                  linka:
                    form.get(
                      "linka"
                    ),
                  smer:
                    form.get(
                      "smer"
                    ),
                  vuz:
                    form.get(
                      "vuz"
                    ),
                  zacatek:
                    form.get(
                      "zacatek"
                    ),
                  konec:
                    form.get(
                      "konec"
                    ),
                });
              }}
            >
              <div className="form-grid">
                <div>
                  <label>
                    Řidič
                  </label>

                  <select
                    name="uzivatel_id"
                    defaultValue={
                      editing?.uzivatel_id ||
                      ""
                    }
                    required
                  >
                    <option value="">
                      Vyber řidiče
                    </option>

                    {profiles.map(
                      (profile) => (
                        <option
                          key={
                            profile.id
                          }
                          value={
                            profile.id
                          }
                        >
                          {profile.jmeno ||
                            profile.id}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label>
                    Datum
                  </label>

                  <input
                    type="date"
                    name="datum"
                    defaultValue={
                      editing?.datum ||
                      ""
                    }
                    required
                  />
                </div>

                <div>
                  <label>
                    Linka
                  </label>

                  <input
                    name="linka"
                    defaultValue={
                      editing?.linka ||
                      ""
                    }
                    required
                  />
                </div>

                <div>
                  <label>
                    Směr
                  </label>

                  <input
                    name="smer"
                    defaultValue={
                      editing?.smer ||
                      ""
                    }
                  />
                </div>

                <div>
                  <label>
                    Vůz
                  </label>

                  <input
                    name="vuz"
                    defaultValue={
                      editing?.vuz ||
                      ""
                    }
                    required
                  />
                </div>

                <div>
                  <label>
                    Začátek
                  </label>

                  <input
                    type="time"
                    name="zacatek"
                    defaultValue={
                      editing?.zacatek
                        ? String(
                            editing.zacatek
                          ).slice(
                            0,
                            5
                          )
                        : ""
                    }
                    required
                  />
                </div>

                <div>
                  <label>
                    Konec
                  </label>

                  <input
                    type="time"
                    name="konec"
                    defaultValue={
                      editing?.konec
                        ? String(
                            editing.konec
                          ).slice(
                            0,
                            5
                          )
                        : ""
                    }
                    required
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
                    : "✓ Uložit"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="user-filter">
          <select
            value={filterUser}
            onChange={(e) =>
              setFilterUser(
                e.target.value
              )
            }
          >
            <option value="all">
              Všichni řidiči
            </option>

            {profiles.map(
              (profile) => (
                <option
                  key={profile.id}
                  value={profile.id}
                >
                  {profile.jmeno ||
                    profile.id}
                </option>
              )
            )}
          </select>
        </div>

        {loading && (
          <div className="empty">
            Načítání výkazů...
          </div>
        )}

        {!loading &&
          filteredReports.length ===
            0 && (
            <div className="empty">
              Žádné výkazy.
            </div>
          )}

        {!loading &&
          filteredReports.length > 0 && (
            <div className="reports-list">
              {filteredReports.map(
                (report) => (
                  <div
                    className="report-card"
                    key={report.id}
                  >
                    <div className="report-date">
                      {new Date(
                        `${report.datum}T00:00:00`
                      ).toLocaleDateString(
                        "cs-CZ"
                      )}
                    </div>

                    <div>
                      <strong>
                        {getUserName(
                          report.uzivatel_id
                        )}
                      </strong>

                      <small>
                        Linka{" "}
                        {report.linka}
                        {report.smer
                          ? ` • ${report.smer}`
                          : ""}
                      </small>
                    </div>

                    <div>
                      <small>
                        Vůz
                      </small>

                      <strong>
                        {report.vuz}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Čas
                      </small>

                      <strong>
                        {String(
                          report.zacatek
                        ).slice(
                          0,
                          5
                        )}
                        {" – "}
                        {String(
                          report.konec
                        ).slice(
                          0,
                          5
                        )}
                      </strong>
                    </div>

                    <div className="report-actions">
                      <button
                        className="edit-button"
                        onClick={() => {
                          setEditing(
                            report
                          );
                          setShowForm(
                            true
                          );
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteReport(
                            report.id
                          )
                        }
                      >
                        🗑️
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
   SPRÁVA UŽIVATELŮ
========================================================= */

function AdminUsers() {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filterRole, setFilterRole] =
    useState("Vše");

  async function loadUsers() {
    setLoading(true);
    setError("");

    const { data, error } =
      await supabase
        .from("profiles")
        .select(
          "id, jmeno, role, created_at"
        )
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

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(
    id,
    role
  ) {
    const { error } =
      await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadUsers();
  }

  const filtered =
    users.filter((user) => {
      return (
        filterRole === "Vše" ||
        user.role === filterRole
      );
    });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>
            Správa uživatelů
          </h1>

          <p>
            Správa účtů a rolí
          </p>
        </div>

        <div className="profile-badge">
          POUZE ADMIN
        </div>
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      <div className="panel">
        <h2>Uživatelé</h2>

        <div className="user-filter">
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(
                e.target.value
              )
            }
          >
            <option>Vše</option>
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

        {loading && (
          <div className="empty">
            Načítání...
          </div>
        )}

        {!loading &&
          filtered.map((user) => (
            <div
              className="user-card"
              key={user.id}
            >
              <div className="user-card-avatar">
                {(user.jmeno ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-card-main">
                <strong>
                  {user.jmeno ||
                    "Bez jména"}
                </strong>

                <small>
                  {user.id}
                </small>
              </div>

              <div>
                <small>
                  Role
                </small>

                <strong>
                  {getRoleName(
                    user.role
                  )}
                </strong>
              </div>

              <select
                value={
                  user.role ||
                  ROLE_RIDIC
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
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

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

    const { data, error } =
      await supabase
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

  useEffect(() => {
    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          const loggedUser =
            session?.user ||
            null;

          setUser(loggedUser);

          if (loggedUser) {
            await loadProfile(
              loggedUser
            );
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

    const loggedUser =
      data?.user || null;

    setUser(loggedUser);

    if (loggedUser) {
      await loadProfile(
        loggedUser
      );
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setPage("dashboard");
  }

  if (
    loading ||
    profileLoading
  ) {
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
    if (showRegister) {
      return (
        <>
          <style>
            {styles}
          </style>

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
        <style>
          {styles}
        </style>

        <Login
          onLogin={async (
            loggedUser
          ) => {
            setUser(
              loggedUser
            );

            await loadProfile(
              loggedUser
            );
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

  const role =
    profile?.role?.toLowerCase() ||
    "";

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

            {useReports && (
              <button
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
                  page ===
                  "adminVehicles"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(
                    "adminVehicles"
                  )
                }
              >
                <span>⚙</span>
                Administrace vozů
              </button>
            )}

            {manageReports && (
              <button
                className={
                  page ===
                  "adminReports"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(
                    "adminReports"
                  )
                }
              >
                <span>📋</span>
                Správa výkazů
              </button>
            )}

            {manageUsers && (
              <button
                className={
                  page ===
                  "adminUsers"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPage(
                    "adminUsers"
                  )
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
                  {roleName}
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

                  <strong>14</strong>
                </div>

                <div className="stat">
                  <span>
                    Vozy celkem
                  </span>

                  <strong>42</strong>
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
                  {profile?.jmeno ||
                    user.email}{" "}
                  👋
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

          {page ===
            "departures" && (
            <div className="panel">
              <h1>Výpravy</h1>

              <p>
                Tady budou výpravy vozů.
              </p>
            </div>
          )}

          {page ===
            "vehicles" && (
            <Vehicles />
          )}

          {page ===
            "reports" &&
            useReports && (
              <MyReports user={user} />
            )}

          {page ===
            "adminVehicles" &&
            manageVehicles && (
              <AdminVehicles />
            )}

          {page ===
            "adminReports" &&
            manageReports && (
              <AdminReports />
            )}

          {page ===
            "adminUsers" &&
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
  color: white;
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
.delete-button,
.edit-button {
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
  color: #172033;
}

.primary-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.delete-button {
  background: #fee2e2;
  color: #b91c1c;
}

.edit-button {
  background: #dbeafe;
  color: #1d4ed8;
}

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
  margin-bottom: 20px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #edf0f5;
  border-radius: 12px;
}

.user-create-box h3 {
  margin-top: 0;
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

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 25px;
  flex-wrap: wrap;
}

.search {
  width: 100%;
  padding: 13px;
  border: 1px solid #d9dee7;
  border-radius: 9px;
  outline: none;
  margin: 20px 0;
}

.vehicle-admin-list {
  display: flex;
  flex-direction: column;
}

.vehicle-admin-card {
  display: grid;
  grid-template-columns: 80px 1fr auto auto;
  gap: 20px;
  align-items: center;
  padding: 16px 5px;
  border-bottom: 1px solid #edf0f5;
}

.vehicle-number {
  font-size: 22px;
  font-weight: 800;
  color: #2563eb;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.vehicle-info small,
.report-card small {
  color: #718096;
}

.vehicle-actions {
  display: flex;
  gap: 8px;
}

.status {
  display: inline-block;
  padding: 6px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.vehicle-row {
  display: grid;
  grid-template-columns: 80px 140px 1fr 120px 80px 160px;
  gap: 15px;
  align-items: center;
  padding: 16px 13px;
  border-bottom: 1px solid #edf0f5;
  font-size: 14px;
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

.user-card {
  display: grid;
  grid-template-columns: auto 1fr 1fr 170px;
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
  color: #718096;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.reports-list {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}

.report-card {
  display: grid;
  grid-template-columns: 120px 2fr 100px 150px auto;
  gap: 20px;
  align-items: center;
  padding: 17px 5px;
  border-bottom: 1px solid #edf0f5;
}

.report-card > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-date {
  font-weight: 800;
  color: #2563eb;
}

.report-actions {
  display: flex !important;
  flex-direction: row !important;
  gap: 7px;
}

.report-actions button {
  padding: 8px 10px;
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .vehicle-admin-card {
    grid-template-columns: 70px 1fr;
  }

  .vehicle-actions {
    grid-column: span 2;
  }

  .report-card {
    grid-template-columns: 1fr 1fr;
  }

  .report-actions {
    grid-column: span 2;
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
    grid-template-columns: auto 1fr;
  }

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

  .stats {
    grid-template-columns: 1fr;
  }

  .users-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .vehicle-admin-card,
  .user-card,
  .report-card {
    grid-template-columns: 1fr;
  }

  .vehicle-actions,
  .report-actions {
    grid-column: auto;
  }

  .panel {
    padding: 18px;
  }
}
`;

export default App;
```
