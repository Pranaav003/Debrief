export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
        fontFamily: "inherit",
        background: "#0a0a0a",
        color: "#f4f4f5",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600 }}>This debrief isn&apos;t public</h1>
      <p style={{ color: "#6b7280" }}>The link may have been revoked or never shared.</p>
      <a href="/app" style={{ color: "#3b82f6", textDecoration: "none" }}>
        Create your own debrief →
      </a>
    </div>
  );
}

