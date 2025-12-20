from fastapi import FastAPI

app = FastAPI(title="Student Wellness API")

@app.get("/")
def root():
    return {"status": "API running"}

