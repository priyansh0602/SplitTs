"use client";

import { useState, useRef, useCallback } from "react";
import { processZip } from "./split";

// ── SVG Icons (inline for zero dependencies) ────────────────────────────────

const UploadIcon = () => (
  <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PartFileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const LockIcon = () => (
  <svg className="lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckIcon = () => (
  <svg className="success-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const FilterIcon = () => (
  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ChunksIcon = () => (
  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const RazorpayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.297L11.65 24h4.391L22.436 0zM7.638 7.81L1.564 24h4.39l4.39-11.62-2.706-4.57z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M12 18v-6" />
    <path d="M9 15l3 3 3-3" />
  </svg>
);

const CheckBadgeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ShieldSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function Home() {
  // State management
  const [appState, setAppState] = useState("upload"); // "upload" | "processing" | "locked" | "unlocked"
  const [file, setFile] = useState(null);
  const [partSize, setPartSize] = useState(30);
  const [parts, setParts] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const fileInputRef = useRef(null);

  // ── File Handling ──────────────────────────────────────────────────────

  const handleFile = useCallback((f) => {
    if (f && f.name.endsWith(".zip")) {
      setFile(f);
      setError(null);
      setParts([]);
      setAppState("upload");
    } else {
      setError("Please upload a .zip file");
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    handleFile(e.target.files[0]);
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setParts([]);
    setAppState("upload");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── Split Processing ──────────────────────────────────────────────────

  const handleSplit = useCallback(async () => {
    if (!file) return;

    setAppState("processing");
    setError(null);
    setProgress({ stage: "reading", message: "Reading zip file..." });

    try {
      const result = await processZip(file, partSize, (p) => setProgress(p));
      setParts(result);
      setAppState("locked");
    } catch (err) {
      console.error("Split error:", err);
      setError("Failed to process zip file. Please try again.");
      setAppState("upload");
    }
  }, [file, partSize]);

  // ── Payment Flow ───────────────────────────────────────────────────────

  const handlePayment = useCallback(async () => {
    setPaymentLoading(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!orderRes.ok) throw new Error("Failed to create order");

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SplitTs",
        description: "Unlock split project downloads",
        order_id: orderData.order_id,
        handler: async (response) => {
          // Step 3: Verify payment
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setAppState("unlocked");
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Payment verification failed. Please try again.");
          }
          setPaymentLoading(false);
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
        theme: {
          color: "#4d8eff",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to initiate payment. Please try again.");
      setPaymentLoading(false);
    }
  }, []);

  // ── Download Handler ───────────────────────────────────────────────────

  const handleDownload = useCallback((part) => {
    const blob = new Blob([part.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = part.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar" id="navbar">
        <span className="navbar-brand">SplitTs</span>
        <button
          className="navbar-link"
          onClick={() => setShowHowItWorks(true)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
          id="how-it-works-btn"
        >
          How It Works
        </button>
      </nav>

      {/* Hero */}
      <section className="hero" id="hero">
        <h1 className="hero-title">Make your project token-efficient</h1>
        <p className="hero-subtitle">
          Upload your project zip and split it the way Claude actually accepts it
        </p>
        <p className="hero-description">
          Stop hitting context limits. Feed your entire codebase to Claude — cleanly, in parts.
          We strip the noise, keep the code, and split it into perfectly sized chunks ready for
          Claude&apos;s context window.
        </p>
      </section>

      {/* Main Grid — Two Columns */}
      <div className="main-grid" id="main-content">
        {/* Left Column — Upload / Config */}
        <div className="card" id="upload-card">
          {file && appState === "upload" ? (
            <>
              <div className="card-title">Configuration</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
                <div />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="code-md" style={{ color: "var(--primary-container)" }}>{file.name}</span>
                  <span className="code-sm" style={{ color: "var(--outline)" }}>({formatBytes(file.size)})</span>
                </div>
              </div>

              {/* File selected indicator */}
              <div className="file-selected" id="file-selected">
                <div className="file-selected-icon">
                  <FileIcon />
                </div>
                <div className="file-selected-info">
                  <div className="file-selected-name">{file.name}</div>
                  <div className="file-selected-size">{formatBytes(file.size)}</div>
                </div>
                <button className="file-selected-remove" onClick={removeFile} aria-label="Remove file" id="remove-file-btn">
                  ×
                </button>
              </div>

              {/* Part Size Slider */}
              <div className="slider-group" id="part-size-slider">
                <div className="slider-label">
                  <span className="slider-label-text">Part Size (MB)</span>
                  <span className="slider-value">{partSize}MB</span>
                </div>
                <input
                  type="range"
                  className="slider"
                  min="5"
                  max="100"
                  value={partSize}
                  onChange={(e) => setPartSize(Number(e.target.value))}
                />
                <div className="slider-hint">
                  Smaller parts are safer for standard Claude 3.5 Sonnet windows
                </div>
              </div>

              {/* Badges */}
              <div className="badges-row" id="badges">
                <span className="badge">
                  <CheckBadgeIcon />
                  Node_modules stripped
                </span>
                <span className="badge">
                  <CheckBadgeIcon />
                  Minified files ignored
                </span>
              </div>

              {/* Split Button */}
              <button
                className="btn-primary"
                onClick={handleSplit}
                id="split-btn"
              >
                Split Project
              </button>
            </>
          ) : (
            <>
              {/* Dropzone */}
              <div
                className={`dropzone ${dragOver ? "drag-over" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                id="dropzone"
              >
                <UploadIcon />
                <div className="dropzone-title">Drop your project .zip here</div>
                <div className="dropzone-subtitle">or click to browse</div>
                <div className="dropzone-support">
                  Supports any framework — React, Next.js, Node, Python, and more
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                  id="file-input"
                />
              </div>

              {/* Part Size Slider (always visible) */}
              <div className="slider-group" style={{ marginTop: "var(--space-lg)" }} id="part-size-slider-default">
                <div className="slider-label">
                  <span className="slider-label-text">Target Part Size</span>
                  <span className="slider-value">{partSize}MB</span>
                </div>
                <input
                  type="range"
                  className="slider"
                  min="5"
                  max="100"
                  value={partSize}
                  onChange={(e) => setPartSize(Number(e.target.value))}
                />
                <div className="slider-hint">
                  Smaller parts are safer for standard Claude 3.5 Sonnet windows
                </div>
              </div>

              {/* Split Button */}
              <button
                className="btn-primary"
                disabled={!file}
                onClick={handleSplit}
                style={{ marginTop: "var(--space-md)" }}
                id="split-btn-default"
              >
                Split Project
              </button>
            </>
          )}
        </div>

        {/* Right Column — Results */}
        <div className="card" id="results-card">
          {appState === "upload" && parts.length === 0 && (
            <>
              <div className="card-title">Your files are ready</div>
              <div className="card-subtitle">Unnecessary files removed. Code formatted. Claude-ready.</div>
              <div className="empty-state">
                <EmptyStateIcon />
                <div className="empty-state-text">Upload a project to generate chunks</div>
              </div>
            </>
          )}

          {appState === "processing" && (
            <>
              <div className="card-title">Processing</div>
              <div className="card-subtitle">Reading and splitting your project...</div>
              <div className="processing-state">
                <div className="processing-spinner" />
                <div className="processing-text">{progress?.message || "Working..."}</div>
                <div className="processing-subtext">
                  Everything happens locally in your browser
                </div>
              </div>
            </>
          )}

          {(appState === "locked" || appState === "unlocked") && parts.length > 0 && (
            <>
              <div className="card-title">Your files are ready</div>
              <div className="card-subtitle">Unnecessary files removed. Code formatted. Claude-ready.</div>

              {/* Parts List */}
              <div className="parts-list fade-in" id="parts-list">
                {parts.map((part, index) => (
                  <div className="part-item" key={index} id={`part-${index}`}>
                    <div className="part-icon">
                      <PartFileIcon />
                    </div>
                    <div className="part-info">
                      <div className="part-name">{part.name}</div>
                      <div className="part-size">{formatBytes(part.size)}</div>
                    </div>
                    {appState === "unlocked" ? (
                      <button
                        className="btn-download"
                        onClick={() => handleDownload(part)}
                        id={`download-btn-${index}`}
                      >
                        <DownloadIcon />
                        DOWNLOAD
                      </button>
                    ) : (
                      <button className="btn-download locked" id={`download-btn-locked-${index}`}>
                        <LockIcon />
                        DOWNLOAD
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Unlock / Success Section */}
              {appState === "locked" && (
                <div className="unlock-section" id="unlock-section">
                  <button
                    className="btn-unlock"
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    id="unlock-btn"
                  >
                    <RazorpayIcon />
                    {paymentLoading ? "Processing..." : "Unlock Downloads — ₹1"}
                  </button>
                  <div className="helper-text">
                    One-time ₹1 per split. No account needed.
                  </div>
                </div>
              )}

              {appState === "unlocked" && (
                <div className="success-banner fade-in" id="success-banner">
                  <CheckIcon />
                  <span className="success-banner-text">
                    Success! Your token-efficient files are ready
                  </span>
                </div>
              )}
            </>
          )}

          {/* Error display */}
          {error && (
            <div className="error-toast" id="error-toast">
              <span className="error-toast-text">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <section className="features-grid" id="features">
        <div className="feature-card" id="feature-filtering">
          <FilterIcon />
          <h3 className="feature-title">Intelligent Filtering</h3>
          <p className="feature-description">
            Automatically removes .git, node_modules, dist, and large binary assets to save your tokens.
          </p>
        </div>
        <div className="feature-card" id="feature-chunks">
          <ChunksIcon />
          <h3 className="feature-title">Perfect Chunks</h3>
          <p className="feature-description">
            Maintains directory structure and splits massive files smoothly so your context window never overflows.
          </p>
        </div>
        <div className="feature-card" id="feature-local">
          <ShieldIcon />
          <h3 className="feature-title">Local Processing</h3>
          <p className="feature-description">
            We process in-browser and split instructions instantly. Your secrets stay in your environment.
          </p>
        </div>
      </section>

      {/* Privacy Note */}
      <div className="privacy-note" id="privacy-note">
        <ShieldSmallIcon />
        <span>Your files never leave your browser. All processing is 100% client-side.</span>
      </div>

      {/* Footer */}
      <footer className="footer" id="footer">
        <p className="footer-text">SplitTs — Built for developers who think in context windows.</p>
      </footer>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div className="modal-overlay" onClick={() => setShowHowItWorks(false)} id="how-it-works-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">How It Works</h2>
              <button className="modal-close" onClick={() => setShowHowItWorks(false)} id="modal-close-btn">
                ×
              </button>
            </div>
            <div className="modal-steps">
              <div className="modal-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <div className="step-title">Upload your project</div>
                  <div className="step-description">
                    Drag and drop or browse for your project&apos;s .zip file. Works with any framework.
                  </div>
                </div>
              </div>
              <div className="modal-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <div className="step-title">We clean &amp; split</div>
                  <div className="step-description">
                    SplitTs strips node_modules, build artifacts, lock files, binaries, and media.
                    Then it splits your clean code into perfectly sized .txt parts.
                  </div>
                </div>
              </div>
              <div className="modal-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <div className="step-title">Pay ₹1 to unlock</div>
                  <div className="step-description">
                    A tiny one-time payment per split. No accounts, no subscriptions. Just ₹1 via Razorpay.
                  </div>
                </div>
              </div>
              <div className="modal-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <div className="step-title">Download &amp; feed to Claude</div>
                  <div className="step-description">
                    Download each part and upload them to Claude one by one. Each part includes instructions
                    for Claude to wait until all parts are uploaded.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
