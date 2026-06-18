<div align="center">

# 📸 Muster

**Face-recognition attendance, run entirely on your own machine.**

A FastAPI backend and a React dashboard that mark students present from a live
camera feed — no paid APIs, no cloud uploads, all vision processing stays local.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-YuNet%20%2B%20SFace-5C3EE8?logo=opencv&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)

</div>

---

## 🎯 Overview

Muster turns an ordinary webcam into an automatic attendance register. Enrol a
student once from a photo, and during a live session the system recognises their
face and logs them against the active class period. Detection, recognition, and
age/gender estimation all run locally with OpenCV — nothing leaves the device.

## ✨ Features

- 🔐 **Token-based login** with `admin` and `professor` roles
- 🧑‍🎓 **Student records** with face enrolment from a single photo
- 👩‍🏫 **Professor profiles** and class-schedule management
- 🎥 **Live webcam attendance** — recognises enrolled students and logs them
  against the active period automatically
- ✍️ **Manual attendance** marking when a face can't be captured
- 🧬 **Age & gender estimation** from the same frame (Caffe models)
- 📊 **Attendance log** with filters (branch, semester, period, date, status) and
  one-click **Excel export**

## 🧰 Tech stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Backend  | FastAPI · SQLAlchemy · SQLite             |
| Vision   | OpenCV (YuNet detect, SFace recognise) · Caffe age/gender |
| Frontend | React · Vite · React Router               |
| Auth     | JWT (python-jose) · bcrypt                |

## 🗂️ Project structure

```
.
├── package.json            root scripts (run backend + frontend together)
├── scripts/                helper for the npm run scripts
├── backend
│   ├── app
│   │   ├── routers/        API endpoints
│   │   ├── face.py         detection, recognition, age/gender
│   │   ├── models.py       database tables
│   │   ├── schemas.py      request/response models
│   │   ├── services.py     attendance logic
│   │   └── main.py         application entry point
│   ├── models/             model files (downloaded, not in git)
│   ├── download_models.py  fetches the model files
│   └── requirements.txt
└── frontend
    ├── src
    │   ├── pages/          screens
    │   ├── components/     layout and shared UI
    │   └── api/            HTTP client
    └── package.json
```

## 🚀 Getting started

The backend (Python) and frontend (Node) are separate stacks. Set up each once,
then start them together from the project root.

### Prerequisites

- Python 3.10+
- Node.js 18+
- A webcam (for live attendance)

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python download_models.py     # fetch face / age / gender models (~125 MB, once)
cp .env.example .env          # then edit the values
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. Interactive docs live at
`http://localhost:8000/docs`.

On first run the database is created and two accounts are seeded:

| Role      | Username    | Password   |
| --------- | ----------- | ---------- |
| Admin     | `admin`     | `admin123` |
| Professor | `professor` | `prof123`  |

> ⚠️ Change these in `.env` before deploying anywhere real.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL if the API is not on :8000
npm run dev
```

The app runs on `http://localhost:5173`.

### 3. Run both together

After the two setups above, install the root runner once and start everything
with a single command from the project root:

```bash
npm install        # once, installs the dev runner
npm run dev        # starts backend + frontend together
```

The individual scripts are also available: `npm run backend` and
`npm run frontend`. The backend script uses the virtual environment in
`backend/.venv`, so create it first (see step 1).

## 🧠 How attendance is recorded

During a live session you choose the branch, semester, and (optionally) subject.
The camera streams frames to the backend, which recognises enrolled faces. A
student is marked **present** when:

1. their face matches an enrolled encoding,
2. they match the selected branch / semester / subject, **and**
3. the current time falls inside a scheduled period.

Each student is logged once per period per day. Recognition uses cosine
similarity on SFace embeddings.

## 📄 License

Licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.
