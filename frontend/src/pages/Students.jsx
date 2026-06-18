import { useEffect, useState } from "react";

import { api } from "../api/client";
import Modal from "../components/Modal";
import { fileToDataUrl } from "../utils";

const EMPTY = {
  roll_no: "",
  name: "",
  branch: "",
  semester: "",
  admission_year: "",
  subject: "",
  gender: "",
  age: "",
  image: null,
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  async function load() {
    setStudents(await api.get("/api/students"));
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function openCreate() {
    setFormError("");
    setEditing({ ...EMPTY, isNew: true });
  }

  function openEdit(student) {
    setFormError("");
    setEditing({ ...EMPTY, ...student, image: null, isNew: false });
  }

  async function onPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setEditing((prev) => ({ ...prev, image: dataUrl }));
  }

  async function save(event) {
    event.preventDefault();
    setFormError("");
    const payload = {
      name: editing.name,
      branch: editing.branch || null,
      semester: editing.semester ? Number(editing.semester) : null,
      admission_year: editing.admission_year ? Number(editing.admission_year) : null,
      subject: editing.subject || null,
      gender: editing.gender || null,
      age: editing.age ? Number(editing.age) : null,
    };
    if (editing.image) payload.image = editing.image;

    try {
      if (editing.isNew) {
        await api.post("/api/students", { roll_no: editing.roll_no, ...payload });
      } else {
        await api.put(`/api/students/${editing.roll_no}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function remove(rollNo) {
    if (!window.confirm(`Delete student ${rollNo}?`)) return;
    await api.delete(`/api/students/${rollNo}`);
    load();
  }

  function field(key, value) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <button onClick={openCreate}>Add student</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Branch</th>
            <th>Semester</th>
            <th>Subject</th>
            <th>Face</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.roll_no}>
              <td>{student.roll_no}</td>
              <td>{student.name}</td>
              <td>{student.branch || "—"}</td>
              <td>{student.semester ?? "—"}</td>
              <td>{student.subject || "—"}</td>
              <td>
                <span className={`badge ${student.has_face ? "yes" : "no"}`}>
                  {student.has_face ? "Enrolled" : "None"}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button className="ghost" onClick={() => openEdit(student)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(student.roll_no)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No students yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.isNew ? "Add student" : `Edit ${editing.roll_no}`} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label>Roll number</label>
                <input
                  value={editing.roll_no}
                  onChange={(event) => field("roll_no", event.target.value)}
                  disabled={!editing.isNew}
                  required
                />
              </div>
              <div className="field">
                <label>Name</label>
                <input value={editing.name} onChange={(event) => field("name", event.target.value)} required />
              </div>
              <div className="field">
                <label>Branch</label>
                <input value={editing.branch} onChange={(event) => field("branch", event.target.value)} />
              </div>
              <div className="field">
                <label>Semester</label>
                <input
                  type="number"
                  value={editing.semester}
                  onChange={(event) => field("semester", event.target.value)}
                />
              </div>
              <div className="field">
                <label>Admission year</label>
                <input
                  type="number"
                  value={editing.admission_year}
                  onChange={(event) => field("admission_year", event.target.value)}
                />
              </div>
              <div className="field">
                <label>Subject</label>
                <input value={editing.subject} onChange={(event) => field("subject", event.target.value)} />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={editing.gender || ""} onChange={(event) => field("gender", event.target.value)}>
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="field">
                <label>Age</label>
                <input type="number" value={editing.age} onChange={(event) => field("age", event.target.value)} />
              </div>
            </div>
            <div className="field" style={{ marginTop: "1rem" }}>
              <label>Face photo {editing.isNew ? "(optional)" : "(upload to replace)"}</label>
              <input type="file" accept="image/*" onChange={onPhoto} />
            </div>
            {formError && <div className="error" style={{ marginTop: "0.75rem" }}>{formError}</div>}
            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
