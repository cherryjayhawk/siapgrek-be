import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Intelligent Service")

# Standard CORS
origins = os.environ.get("TRUSTED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "intelligent-service"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("SERVICE_PORT", 3003))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

