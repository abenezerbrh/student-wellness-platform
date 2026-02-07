from fastapi import FastAPI

from app.database import engine, Base
from app.routers import session, wellness

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse
from fastapi import Request

# from app.routers import courses       # disabled for now

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev-friendly; lock down later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(session.router)
app.include_router(wellness.router)

#app.include_router(courses.router)

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/courses")
def courses_coming_soon():
    return {
        "status": "coming_soon",
        "message": "Course tracking is under active development."
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "path": request.url.path
        }
    )

