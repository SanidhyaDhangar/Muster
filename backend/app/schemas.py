from typing import Optional

from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str


class StudentBase(BaseModel):
    name: str
    branch: Optional[str] = None
    semester: Optional[int] = None
    admission_year: Optional[int] = None
    subject: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None


class StudentCreate(StudentBase):
    roll_no: str
    image: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    admission_year: Optional[int] = None
    subject: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    image: Optional[str] = None


class StudentOut(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    roll_no: str
    has_face: bool = False


class ProfessorBase(BaseModel):
    name: str
    department: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    achievements: Optional[str] = None
    others: Optional[str] = None
    photo: Optional[str] = None


class ProfessorCreate(ProfessorBase):
    prof_id: str


class ProfessorUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    achievements: Optional[str] = None
    others: Optional[str] = None
    photo: Optional[str] = None


class ProfessorOut(ProfessorBase):
    model_config = ConfigDict(from_attributes=True)

    prof_id: str


class PeriodBase(BaseModel):
    period_name: str
    start_time: str
    end_time: str
    prof_id: Optional[str] = None
    description: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None


class PeriodCreate(PeriodBase):
    pass


class PeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    prof_id: Optional[str] = None
    description: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None


class PeriodOut(PeriodBase):
    model_config = ConfigDict(from_attributes=True)

    period_id: int
    prof_name: Optional[str] = None


class AttendanceRow(BaseModel):
    student_roll_no: str
    student_name: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    period_name: Optional[str] = None
    prof_name: Optional[str] = None
    status: str
    timestamp: Optional[str] = None


class ManualAttendanceRequest(BaseModel):
    period_id: int
    date: Optional[str] = None
    present_roll_nos: list[str] = []


class RecognizeRequest(BaseModel):
    image: str
    branches: list[str] = []
    semester: Optional[int] = None
    subject: Optional[str] = None


class FaceResult(BaseModel):
    box: list[int]
    name: Optional[str] = None
    roll_no: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    status: str
    score: float


class RecognizeResponse(BaseModel):
    faces: list[FaceResult]


class FilterOptions(BaseModel):
    branches: list[str]
    semesters: list[int]
    subjects: list[str]
