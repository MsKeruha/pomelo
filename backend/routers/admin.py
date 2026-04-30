from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, timedelta

import models, schemas, auth_utils
from database import get_db
from dependencies import get_current_admin, get_current_staff

router = APIRouter(tags=["admin"])

@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(role: Optional[str] = None, admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()

@router.post("/admin/users", response_model=schemas.UserResponse)
def create_admin_user(user: schemas.UserCreate, role: str = "manager", admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Цей Email вже зареєстровано")
    
    hashed_pwd = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/admin/users/{user_id}", dependencies=[Depends(get_current_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    if db_user.role == "admin":
        raise HTTPException(status_code=403, detail="Неможливо видалити адміністраторів")
    db.delete(db_user)
    db.commit()
    return {"ok": True}

@router.get("/admin/stats", dependencies=[Depends(get_current_staff)])
def get_admin_stats(db: Session = Depends(get_db)):
    total_bookings = db.query(models.Booking).count()
    total_users = db.query(models.User).count()
    total_revenue = db.query(func.sum(models.Booking.total_price)).scalar() or 0
    return {
        "total_bookings": total_bookings,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "active_chats": db.query(models.ChatMessage.sender_id).filter(models.ChatMessage.is_from_staff == False).distinct().count()
    }

@router.get("/admin/stats/monthly", dependencies=[Depends(get_current_staff)])
def get_monthly_stats(db: Session = Depends(get_db)):
    result = []
    now = datetime.utcnow()
    for i in range(11, -1, -1):
        target_date = now.replace(day=1) - timedelta(days=i*30) 
        month = (now.month - i - 1) % 12 + 1
        year = now.year + (now.month - i - 1) // 12
        count = db.query(models.Booking).filter(
            extract('month', models.Booking.created_at) == month,
            extract('year', models.Booking.created_at) == year
        ).count()
        revenue = db.query(func.sum(models.Booking.total_price)).filter(
            extract('month', models.Booking.created_at) == month,
            extract('year', models.Booking.created_at) == year
        ).scalar() or 0
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        result.append({
            "day": month_names[month - 1],
            "val": int(count),
            "revenue": float(revenue),
            "is_current": (month == now.month and year == now.year)
        })
    return result

@router.get("/admin/bookings", response_model=List[schemas.Booking], dependencies=[Depends(get_current_staff)])
def get_all_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).options(
        joinedload(models.Booking.user), 
        joinedload(models.Booking.tour).joinedload(models.Tour.category)
    ).all()

@router.put("/admin/bookings/{booking_id}/status", response_model=schemas.Booking, dependencies=[Depends(get_current_staff)])
def update_booking_status(booking_id: int, status_update: schemas.BookingStatusUpdate, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронювання не знайдено")
    booking.status = status_update.status
    db.commit()
    db.refresh(booking)
    return booking

@router.get("/admin/tours", response_model=List[schemas.Tour], dependencies=[Depends(get_current_staff)])
def get_all_tours_admin(db: Session = Depends(get_db)):
    return db.query(models.Tour).options(joinedload(models.Tour.category)).order_by(models.Tour.id.desc()).all()

# Category Management
@router.post("/admin/categories", response_model=schemas.Category, dependencies=[Depends(get_current_admin)])
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = models.Category(name=category.name, name_en=category.name_en, emoji=category.emoji)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.put("/admin/categories/{cat_id}", response_model=schemas.Category, dependencies=[Depends(get_current_admin)])
def update_category(cat_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")
    db_cat.name = category.name
    db_cat.name_en = category.name_en
    db_cat.emoji = category.emoji
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/admin/categories/{cat_id}", dependencies=[Depends(get_current_admin)])
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")
    
    # Check if any tours use this category
    tours_using = db.query(models.Tour).filter(models.Tour.category_id == cat_id).count()
    if tours_using > 0:
        raise HTTPException(status_code=400, detail="Неможливо видалити категорію, яка використовується в турах.")
        
    db.delete(db_cat)
    db.commit()
    return {"ok": True}

# Settings Management
@router.get("/admin/settings", response_model=List[schemas.SystemSetting], dependencies=[Depends(get_current_staff)])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(models.SystemSetting).all()

@router.put("/admin/settings/{name}", response_model=schemas.SystemSetting, dependencies=[Depends(get_current_admin)])
def update_setting(name: str, setting: schemas.SystemSettingValue, db: Session = Depends(get_db)):
    db_setting = db.query(models.SystemSetting).filter(models.SystemSetting.name == name).first()
    if not db_setting:
        # Create if not exists
        db_setting = models.SystemSetting(name=name, value=setting.value)
        db.add(db_setting)
    else:
        db_setting.value = setting.value
    db.commit()
    db.refresh(db_setting)
    return db_setting
