import { useEffect, useMemo, useState } from "react";

import { api, downloadFile } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { today } from "../utils";

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  return params.toString();
}

function LogTab({ periods, options, isAdmin }) {
  const [filters, setFilters] = useState({ branch: "", semester: "", period_id: "", date: "", status: "all" });
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function loadLogs() {
    setRows(await api.get(`/api/attendance/logs?${buildQuery(filters)}`));
    setLoaded(true);
  }

  function field(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function exportXlsx() {
    await downloadFile(`/api/attendance/export?${buildQuery(filters)}`, "attendance.xlsx");
  }

  return (
    <div>
      <div className="toolbar">
        <div className="field">
          <label>Branch</label>
          <select value={filters.branch} onChange={(event) => field("branch", event.target.value)}>
            <option value="">All</option>
            {options.branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Semester</label>
          <select value={filters.semester} onChange={(event) => field("semester", event.target.value)}>
            <option value="">All</option>
            {options.semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Period</label>
          <select value={filters.period_id} onChange={(event) => field("period_id", event.target.value)}>
            <option value="">All</option>
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {period.period_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={filters.date} onChange={(event) => field("date", event.target.value)} />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={filters.status} onChange={(event) => field("status", event.target.value)}>
            <option value="all">All</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
        <button onClick={loadLogs}>Apply</button>
        <button className="ghost" onClick={exportXlsx}>
          Export Excel
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Branch</th>
            <th>Semester</th>
            <th>Period</th>
            <th>Professor</th>
            <th>Status</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.student_roll_no}-${index}`}>
              <td>{row.student_roll_no}</td>
              <td>{row.student_name || "—"}</td>
              <td>{row.branch || "—"}</td>
              <td>{row.semester ?? "—"}</td>
              <td>{row.period_name || "—"}</td>
              <td>{row.prof_name || "—"}</td>
              <td>
                <span className={`badge ${row.status.toLowerCase()}`}>{row.status}</span>
              </td>
              <td>{row.timestamp || "—"}</td>
            </tr>
          ))}
          {loaded && rows.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">
                No records for these filters.
              </td>
            </tr>
          )}
          {!loaded && (
            <tr>
              <td colSpan={8} className="muted">
                Choose filters and click Apply. Pick a period and date together to see absentees.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MarkTab({ periods }) {
  const [students, setStudents] = useState([]);
  const [periodId, setPeriodId] = useState("");
  const [date, setDate] = useState(today());
  const [selected, setSelected] = useState(() => new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/students").then(setStudents).catch(() => {});
  }, []);

  function toggle(rollNo) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(rollNo) ? next.delete(rollNo) : next.add(rollNo);
      return next;
    });
  }

  async function submit() {
    setMessage("");
    if (!periodId) {
      setMessage("Select a period first.");
      return;
    }
    const result = await api.post("/api/attendance/manual", {
      period_id: Number(periodId),
      date,
      present_roll_nos: [...selected],
    });
    setMessage(`Marked ${result.created} student(s) present.`);
    setSelected(new Set());
  }

  return (
    <div>
      <div className="toolbar">
        <div className="field">
          <label>Period</label>
          <select value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
            <option value="">Select period</option>
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {period.period_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <button onClick={submit}>Mark present</button>
        {message && <span className="muted">{message}</span>}
      </div>

      <table>
        <thead>
          <tr>
            <th>Present</th>
            <th>Roll No</th>
            <th>Name</th>
            <th>Branch</th>
            <th>Semester</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.roll_no}>
              <td>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={selected.has(student.roll_no)}
                  onChange={() => toggle(student.roll_no)}
                />
              </td>
              <td>{student.roll_no}</td>
              <td>{student.name}</td>
              <td>{student.branch || "—"}</td>
              <td>{student.semester ?? "—"}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No students yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Attendance() {
  const { role } = useAuth();
  const [tab, setTab] = useState("log");
  const [periods, setPeriods] = useState([]);
  const [options, setOptions] = useState({ branches: [], semesters: [], subjects: [] });

  useEffect(() => {
    api.get("/api/schedule").then(setPeriods).catch(() => {});
    api.get("/api/students/filters").then(setOptions).catch(() => {});
  }, []);

  const isAdmin = useMemo(() => role === "admin", [role]);

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
      </div>
      <div className="tabs">
        <button className={tab === "log" ? "active" : ""} onClick={() => setTab("log")}>
          Log
        </button>
        <button className={tab === "mark" ? "active" : ""} onClick={() => setTab("mark")}>
          Mark attendance
        </button>
      </div>
      {tab === "log" ? (
        <LogTab periods={periods} options={options} isAdmin={isAdmin} />
      ) : (
        <MarkTab periods={periods} />
      )}
    </div>
  );
}
