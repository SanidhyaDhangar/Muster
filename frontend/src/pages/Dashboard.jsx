import { useEffect, useState } from "react";

import { api } from "../api/client";
import { today } from "../utils";

export default function Dashboard() {
  const [stats, setStats] = useState({ students: 0, professors: 0, periods: 0, present: 0 });
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    async function load() {
      const [students, professors, schedule, logs] = await Promise.all([
        api.get("/api/students"),
        api.get("/api/professors"),
        api.get("/api/schedule"),
        api.get(`/api/attendance/logs?date=${today()}&status=present`),
      ]);
      setStats({
        students: students.length,
        professors: professors.length,
        periods: schedule.length,
        present: logs.length,
      });
      setPeriods(schedule);
    }
    load().catch(() => {});
  }, []);

  const cards = [
    { label: "Students", value: stats.students },
    { label: "Professors", value: stats.professors },
    { label: "Periods", value: stats.periods },
    { label: "Marked present today", value: stats.present },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="stat-grid">
        {cards.map((card) => (
          <div className="card stat-card" key={card.label}>
            <div className="value">{card.value}</div>
            <div className="label">{card.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Schedule</h3>
        {periods.length === 0 ? (
          <p className="muted">No periods configured yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Time</th>
                <th>Professor</th>
                <th>Branch</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.period_id}>
                  <td>{period.period_name}</td>
                  <td>
                    {period.start_time} – {period.end_time}
                  </td>
                  <td>{period.prof_name || "—"}</td>
                  <td>{period.branch || "—"}</td>
                  <td>{period.semester ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
