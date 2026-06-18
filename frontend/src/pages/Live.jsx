import { useEffect, useRef, useState } from "react";

import { api } from "../api/client";

const POLL_INTERVAL = 1200;

const STATUS_COLOR = {
  present: "#2f9e5e",
  already_present: "#2f6df0",
  no_active_period: "#e0892b",
  not_in_session: "#e0892b",
  session_not_configured: "#e0892b",
  unknown: "#8a99b3",
};

const STATUS_LABEL = {
  present: "Marked present",
  already_present: "Already present",
  no_active_period: "No active period",
  not_in_session: "Outside session filter",
  session_not_configured: "Configure session",
  unknown: "Unknown face",
};

export default function Live() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const captureRef = useRef(document.createElement("canvas"));
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);

  const [options, setOptions] = useState({ branches: [], semesters: [], subjects: [] });
  const [config, setConfig] = useState({ branches: [], semester: "", subject: "" });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    api.get("/api/students/filters").then(setOptions).catch(() => {});
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawOverlay(faces) {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.lineWidth = 3;
    ctx.font = "16px Segoe UI";

    faces.forEach((face) => {
      const [x, y, w, h] = face.box;
      const color = STATUS_COLOR[face.status] || "#8a99b3";
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);

      const label = face.name || "Unknown";
      const detail = [face.gender, face.age].filter(Boolean).join(" · ");
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 22, ctx.measureText(label).width + 16, 22);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + 8, y - 6);
      if (detail) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y + h, ctx.measureText(detail).width + 16, 20);
        ctx.fillStyle = "#fff";
        ctx.fillText(detail, x + 8, y + h + 15);
      }
    });
  }

  function recordFeed(faces) {
    const marked = faces.filter((face) => face.status === "present");
    if (marked.length === 0) return;
    setFeed((prev) => {
      const seen = new Set(prev.map((item) => item.roll_no));
      const additions = marked
        .filter((face) => !seen.has(face.roll_no))
        .map((face) => ({
          roll_no: face.roll_no,
          name: face.name,
          time: new Date().toLocaleTimeString(),
        }));
      return [...additions, ...prev].slice(0, 30);
    });
  }

  async function processFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || busyRef.current) return;
    busyRef.current = true;
    try {
      const canvas = captureRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.7);

      const response = await api.post("/api/recognition/recognize", {
        image,
        branches: config.branches,
        semester: config.semester ? Number(config.semester) : null,
        subject: config.subject || null,
      });
      drawOverlay(response.faces);
      recordFeed(response.faces);
    } catch (err) {
      setError(err.message);
    } finally {
      busyRef.current = false;
    }
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);
      timerRef.current = setInterval(processFrame, POLL_INTERVAL);
    } catch (err) {
      setError("Could not access the camera. Grant permission and try again.");
    }
  }

  function stopCamera() {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setRunning(false);
  }

  function toggleBranch(branch) {
    setConfig((prev) => {
      const branches = prev.branches.includes(branch)
        ? prev.branches.filter((item) => item !== branch)
        : [...prev.branches, branch];
      return { ...prev, branches };
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Live attendance</h1>
        {running ? (
          <button className="danger" onClick={stopCamera}>
            Stop camera
          </button>
        ) : (
          <button onClick={startCamera}>Start camera</button>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="field">
            <label>Branches</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {options.branches.length === 0 && <span className="muted">No branches</span>}
              {options.branches.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  className={config.branches.includes(branch) ? "" : "ghost"}
                  onClick={() => toggleBranch(branch)}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Semester</label>
            <select
              value={config.semester}
              onChange={(event) => setConfig((prev) => ({ ...prev, semester: event.target.value }))}
            >
              <option value="">Any</option>
              {options.semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Subject</label>
            <select
              value={config.subject}
              onChange={(event) => setConfig((prev) => ({ ...prev, subject: event.target.value }))}
            >
              <option value="">Any</option>
              {options.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Attendance is logged only for students matching this filter, during an active scheduled period.
        </p>
      </div>

      <div className="live-grid">
        <div className="video-frame">
          <video ref={videoRef} muted playsInline />
          <canvas ref={overlayRef} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Marked present</h3>
          <div className="feed-list">
            {feed.length === 0 && <span className="muted">No one marked yet.</span>}
            {feed.map((item) => (
              <div className="feed-item" key={`${item.roll_no}-${item.time}`}>
                <span>
                  <strong>{item.name}</strong> · {item.roll_no}
                </span>
                <span className="muted">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
