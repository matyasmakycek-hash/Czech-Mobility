import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  if (loading) {
    return <div className="loading">Načítání...</div>;
  }

  if (!user) {
    return (
      <>
        <style>{styles}</style>
        <Login onLogin={loadUser} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">CM</div>
            <div>
              <div className="brand-title">Czech Mobility</div>
              <div className="brand-subtitle">VDP systém</div>
            </div>
          </div>

          <div className="section-title">Navigace</div>

          <nav className="menu">
            <button>⌂ Dashboard</button>
            <button>◈ Výpravy</button>
            <button>▣ Vozy</button>
            <button>▤ Moje výkazy</button>

            {profile?.role === "admin" && (
              <button>⚙ Administrace</button>
            )}
          </nav>

          <div className="user-box">
            <div className="avatar">
              {(profile?.jmeno || user.email)?.charAt(0).toUpperCase()}
            </div>

            <div className="user-info">
              <div className="user-name">
                {profile?.jmeno || user.email}
              </div>

              <div className="user-role">
                {profile?.role === "admin"
                  ? "Administrátor"
                  : profile?.role === "dispecer"
                  ? "Dispečer"
                  : "Řidič"}
              </div>
            </div>

            <button className="logout" onClick={logout}>
              Odhlásit
            </button>
          </div>
        </aside>

        <main className="content">
          <h1>Dashboard</h1>

          <div className="welcome">
            <h2>Vítej, {profile?.jmeno || user.email} 👋</h2>

            <p>
              Jsi přihlášen jako{" "}
              <strong>
                {profile?.role === "admin"
                  ? "administrátor"
                  : profile?.role === "dispecer"
                  ? "dispečer"
                  : "řidič"}
              </strong>.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

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

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6fa;
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
  font-size: 18px;
  margin-bottom: 20px;
}

.login-box h1 {
  margin: 0;
}

.login-box p {
  color: #718096;
  margin-top: 7px;
}

.login-box form {
  margin-top: 25px;
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
  font-size: 13px;
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
  margin-top: 3px;
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
}

.menu button:hover {
  background: #1a2537;
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
}

.user-role {
  font-size: 11px;
  color: #8d99ad;
  margin-top: 3px;
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

.content h1 {
  margin-top: 0;
}

.welcome {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 3px 14px rgba(0,0,0,.04);
}
`;

export default App;
