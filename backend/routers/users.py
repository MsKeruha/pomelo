from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import os, shutil, uuid

import models, schemas, auth_utils
from database import get_db
from dependencies import get_current_user

router = APIRouter(tags=["users"])

@router.post("/users/me/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Sanitize filename using UUID
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg"
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4()}{ext}"
    
    file_location = f"uploads/{unique_filename}"
    os.makedirs("uploads", exist_ok=True)
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    upload_base = os.getenv("UPLOAD_URL_BASE", "/uploads/")
    avatar_url = f"{upload_base}{unique_filename}"
    
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return {"url": avatar_url}

@router.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate confirmed bookings count
    count = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id,
        models.Booking.status == "Confirmed"
    ).count()
    current_user.bookings_count = count
    return current_user

@router.put("/users/update", response_model=schemas.UserResponse)
def update_user_profile(user_update: schemas.UserBase, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    db_user.email = user_update.email
    db_user.full_name = user_update.full_name
    if user_update.avatar_url is not None:
        db_user.avatar_url = user_update.avatar_url
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/change-password")
def change_password(
    req: schemas.PasswordChangeRequest, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if not auth_utils.verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = auth_utils.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

# Favorites
@router.post("/favorites/{tour_id}")
def toggle_favorite(
    tour_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tour = db.query(models.Tour).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    if tour in current_user.favorites:
        current_user.favorites.remove(tour)
        status = "removed"
    else:
        current_user.favorites.append(tour)
        status = "added"
    
    db.commit()
    return {"status": status}

@router.get("/favorites/me", response_model=List[schemas.Tour])
def get_my_favorites(current_user: models.User = Depends(get_current_user)):
    return current_user.favorites

# Wallet
@router.post("/users/me/topup")
def topup_balance(
    req: schemas.TopUpRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if len(req.card_number.replace(" ", "")) < 16:
        raise HTTPException(status_code=400, detail="Invalid card number")
    
    current_user.balance += req.amount
    
    # Record transaction
    new_transaction = models.Transaction(
        user_id=current_user.id,
        amount=req.amount,
        type="deposit",
        description="Поповнення балансу (картка)"
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(current_user)
    return {"new_balance": current_user.balance}

@router.get("/users/me/transactions", response_model=List[schemas.TransactionResponse])
def get_my_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.timestamp.desc()).all()
