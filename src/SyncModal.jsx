import React, { useState } from "react";

const ACCENT = { soft: "#B2C2D2", deep: "#7C93AC", tint: "#EDF1F5" };

export default function SyncModal({ open, onClose, cloud }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteOk, setNoteOk] = useState(false);

  if (!open) return null;

  const show = (msg, ok) => {
    setNote(msg);
    setNoteOk(!!ok);
  };

  const run = async (fn) => {
    setBusy(true);
    show("");
    try {
      await fn();
      onClose();
    } catch (err) {
      show(cloud.authMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(68,62,58,0.28)",
          zIndex: 80,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 18,
          right: 18,
          top: "18%",
          maxWidth: 390,
          margin: "0 auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 18,
          padding: 18,
          zIndex: 81,
          boxShadow: "0 10px 30px rgba(68,62,58,0.18)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Link all devices
        </div>
        {cloud.user ? (
          <>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, margin: "0 0 14px" }}>
              Signed in as {cloud.user.email}. Kept syncs automatically to your phone, iPad, and anywhere you open the same link.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => cloud.logOut().then(onClose)}
                style={ghostBtn}
              >
                Sign out
              </button>
              <button onClick={onClose} style={primaryBtn}>
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5, margin: "0 0 14px" }}>
              Use the same email and password as The Grand Library. After you sign in here and on your phone, lists stay in step.
            </p>
            {note && (
              <div
                style={{
                  background: noteOk ? ACCENT.tint : "#F7F0EF",
                  color: noteOk ? ACCENT.deep : "#B98A8A",
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontSize: 13,
                  marginBottom: 10,
                  lineHeight: 1.45,
                }}
              >
                {note}
              </div>
            )}
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <button
                disabled={busy}
                onClick={() => run(() => cloud.signIn(email.trim(), password))}
                style={primaryBtn}
              >
                Sign in
              </button>
              <button
                disabled={busy}
                onClick={() => run(() => cloud.signUp(email.trim(), password))}
                style={ghostBtn}
              >
                Create account
              </button>
            </div>
            <button
              disabled={busy}
              onClick={async () => {
                if (!email.trim()) {
                  show("Type your email first, then tap Forgot password.");
                  return;
                }
                try {
                  await cloud.resetPassword(email.trim());
                  show("Reset link sent. Check inbox and spam, then sign in here.", true);
                } catch (err) {
                  show(cloud.authMessage(err));
                }
              }}
              style={{
                marginTop: 10,
                border: "none",
                background: "none",
                color: ACCENT.deep,
                fontFamily: "var(--font-label)",
                fontSize: 12.5,
                fontWeight: 700,
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </>
        )}
      </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  fontFamily: "var(--font-label)",
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-soft)",
  marginBottom: 4,
  marginTop: 8,
};

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid var(--line)",
  borderRadius: 12,
  background: "#fff",
  fontSize: 16,
  fontFamily: "var(--font-body)",
  color: "var(--ink)",
  boxSizing: "border-box",
};

const primaryBtn = {
  flex: 1,
  border: "none",
  borderRadius: 12,
  padding: "11px 14px",
  background: ACCENT.deep,
  color: "#FBF9F4",
  fontFamily: "var(--font-label)",
  fontSize: 13,
  fontWeight: 700,
};

const ghostBtn = {
  flex: 1,
  border: "none",
  borderRadius: 12,
  padding: "11px 14px",
  background: "var(--tint)",
  color: "var(--ink)",
  fontFamily: "var(--font-label)",
  fontSize: 13,
  fontWeight: 700,
};
