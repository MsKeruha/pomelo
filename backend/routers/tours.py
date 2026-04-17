from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List, Optional
import os, shutil, httpx, uuid

import models, schemas
from database import get_db
from dependencies import get_current_user, get_current_staff
from utils import translate_text, auto_translate_tour, CURATED_LOCATIONS

router = APIRouter(tags=["tours"])

@router.post("/upload-image", dependencies=[Depends(get_current_staff)])
async def upload_image(file: UploadFile = File(...)):
    # Sanitize filename using UUID to prevent path traversal and collisions
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg" # Fallback
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    file_location = f"uploads/{unique_filename}"
    os.makedirs("uploads", exist_ok=True)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    upload_base = os.getenv("UPLOAD_URL_BASE", "/uploads/")
    return {"url": f"{upload_base}{unique_filename}"}

@router.get("/admin/search-photos", dependencies=[Depends(get_current_staff)])
async def admin_search_photos(query: str, category: Optional[str] = None):
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    
    if not access_key:
        raise HTTPException(
            status_code=500, 
            detail="Unsplash Access Key not configured."
        )
    
    english_query = await translate_text(query, target='en')
    english_category = await translate_text(category, target='en') if category else None
    
    async with httpx.AsyncClient() as client:
        try:
            results = []
            q1 = f"{english_query} {english_category}" if english_category else english_query
            resp1 = await client.get(
                "https://api.unsplash.com/search/photos",
                params={"query": q1, "per_page": 4, "orientation": "landscape", "client_id": access_key},
                timeout=10
            )
            if resp1.status_code == 200:
                results.extend([p["urls"]["regular"] for p in resp1.json().get("results", [])])
            
            q2 = english_query
            resp2 = await client.get(
                "https://api.unsplash.com/search/photos",
                params={"query": q2, "per_page": 4, "orientation": "landscape", "client_id": access_key},
                timeout=10
            )
            if resp2.status_code == 200:
                new_urls = [p["urls"]["regular"] for p in resp2.json().get("results", [])]
                for url in new_urls:
                    if url not in results:
                        results.append(url)
            
            return results[:8]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@router.get("/locations/curated")
def get_curated_locations():
    return CURATED_LOCATIONS

@router.get("/tours", response_model=List[schemas.Tour])
def get_tours(category_id: int = None, trending: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Tour).options(joinedload(models.Tour.category))
    if category_id:
        query = query.filter(models.Tour.category_id == category_id)
    if trending:
        query = (
            db.query(models.Tour)
            .options(selectinload(models.Tour.category))
            .outerjoin(models.Booking)
            .group_by(models.Tour.id)
            .order_by(func.count(models.Booking.id).desc())
        )
        if category_id:
            query = query.filter(models.Tour.category_id == category_id)
    results = query.order_by(models.Tour.id.desc()).all()
    
    # Apply global markup if exists
    markup_setting = db.query(models.SystemSetting).filter(models.SystemSetting.name == "commission_rate").first()
    if markup_setting:
        try:
            markup_pct = float(markup_setting.value)
            for tour in results:
                tour.price = round(tour.price * (1 + markup_pct / 100), 2)
        except ValueError:
            pass
            
    return results

@router.get("/tours/locations")
def get_tour_locations(db: Session = Depends(get_db)):
    results = db.query(models.Tour.location, models.Tour.location_en).distinct().all()
    return [{"uk": r[0], "en": r[1]} for r in results]

@router.get("/tours/{tour_id}", response_model=schemas.Tour)
def get_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).options(joinedload(models.Tour.category)).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
        
    # Apply global markup if exists
    markup_setting = db.query(models.SystemSetting).filter(models.SystemSetting.name == "commission_rate").first()
    if markup_setting:
        try:
            markup_pct = float(markup_setting.value)
            tour.price = round(tour.price * (1 + markup_pct / 100), 2)
        except ValueError:
            pass
            
    return tour

@router.post("/tours", response_model=schemas.Tour, dependencies=[Depends(get_current_staff)])
async def create_tour(tour: schemas.TourCreate, db: Session = Depends(get_db)):
    tour_data = tour.dict()
    await auto_translate_tour(tour_data)
    new_tour = models.Tour(**tour_data)
    db.add(new_tour)
    db.commit()
    db.refresh(new_tour)
    return new_tour

@router.put("/tours/{tour_id}", response_model=schemas.Tour, dependencies=[Depends(get_current_staff)])
async def update_tour(tour_id: int, tour_update: schemas.TourUpdate, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    update_data = tour_update.dict(exclude_unset=True)
    await auto_translate_tour(update_data)
    for key, value in update_data.items():
        setattr(tour, key, value)
    db.commit()
    db.refresh(tour)
    return tour

@router.delete("/tours/{tour_id}", dependencies=[Depends(get_current_staff)])
def delete_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    db.delete(tour)
    db.commit()
    return {"ok": True}
