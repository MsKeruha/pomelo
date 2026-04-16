import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine
import models
from routers import auth, tours, admin, chat, bookings, users, utils

# Tables are managed via Alembic migrations
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pomelo Travel API")

# Setup static uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(tours.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(bookings.router)
app.include_router(users.router)
app.include_router(utils.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Pomelo Travel API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
