from enum import Enum
from fastapi import HTTPException, FastAPI
from pydantic import BaseModel

app = FastAPI()

class SourceLocation(Enum):
    """Represents different types of sources for classification."""
    LINKEDIN = 'LinkedinExtension'

class ApplyLink(BaseModel):
    Jobtitle: str
    JobLocation: str
    Employer:str
    description: str
    JobUrl: str
    source: SourceLocation

applied = {
    0: ApplyLink(Jobtitle='test1', JobLocation='test1', Employer='test1', description='test1', JobUrl='test1', source=SourceLocation.LINKEDIN),
    1: ApplyLink(Jobtitle='test2', JobLocation='test2', Employer='test2', description='test2', JobUrl='test2', source=SourceLocation.LINKEDIN),
}
next_id = 2

@app.get('/appliedlinks/{job_id}')
def get_job_by_id(job_id: int) -> ApplyLink:
    if job_id not in applied:
        raise HTTPException(status_code = 404, detail = f'ID {job_id} does not exist')
    return ApplyLink[job_id]

@app.get('/')
def index() -> dict[str, dict[int,ApplyLink]]:
    return {'applied': applied}

@app.post('/')
def create_apply(job:ApplyLink) -> dict[str,ApplyLink]:
    if job.id in applied:
        raise HTTPException(status_code=400,detail = f'Already Applied for {job.Jobtitle}')
    
    applied[job.id]  = job
    return {'applied': applied}

