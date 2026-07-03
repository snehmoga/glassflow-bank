import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bank Management System — Admin Portal" },
      { name: "description", content: "Premium Glassmorphism Bank Management System with full account, transaction, and interest calculator modules." },
      { property: "og:title", content: "Bank Management System" },
      { property: "og:description", content: "A premium Glass UI banking dashboard built with HTML, CSS, and JavaScript." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/bank/index.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#050b1f", color: "#eaf2ff", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
        <p>Loading Bank Management System…</p>
        <p style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
          If you are not redirected, <a style={{ color: "#67e8f9" }} href="/bank/index.html">click here</a>.
        </p>
      </div>
    </div>
  );
}
