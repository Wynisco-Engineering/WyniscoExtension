from enum import Enum
from fastapi import HTTPException, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SourceLocation(str, Enum):
    """Represents different types of sources for classification."""
    LINKEDIN = 'LinkedinExtension'
    INDEED = 'IndeedExtension'

# ---- Pydantic Model ----
class ApplyLink(BaseModel):
    Jobtitle: str
    JobLocation: str
    Employer: str
    Description: str
    JobUrl: str
    Source: SourceLocation

# ---- In-memory storage ----
applied: dict[int, ApplyLink] = {
    0: ApplyLink(Jobtitle='test1', JobLocation='test1', Employer='test1', Description='test1', JobUrl='test1', Source=SourceLocation.LINKEDIN),
    1: ApplyLink(Jobtitle='test2', JobLocation='test2', Employer='test2', Description='test2', JobUrl='test2', Source=SourceLocation.LINKEDIN),
}
next_id = 2

# ---- Get job by ID ----
@app.get('/appliedlinks/{job_id}', response_model=ApplyLink)
def get_job_by_id(job_id: int):
    if job_id not in applied:
        raise HTTPException(status_code=404, detail=f'ID {job_id} does not exist')
    return applied[job_id]

# ---- List all applied jobs ----
@app.get('/')
def index():
    return {'applied': {k: v.dict() for k, v in applied.items()}}

@app.post('/', response_model=ApplyLink)
def create_apply(job: ApplyLink):
    global next_id
    if any(existing.JobUrl == job.JobUrl for existing in applied.values()):
        raise HTTPException(status_code=400, detail=f'Already Applied for {job.Jobtitle}')
    applied[next_id] = job
    next_id += 1
    return job
