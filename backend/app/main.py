from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import face
from .config import get_settings
from .database import Base, engine
from .routers import attendance, auth, professors, recognition, schedule, students
from .seed import seed_users

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_users()
    face.load_models()
    yield


app = FastAPI(title="Muster", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(professors.router)
app.include_router(schedule.router)
app.include_router(attendance.router)
app.include_router(recognition.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
