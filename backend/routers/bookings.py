from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(tags=["bookings"])

@router.get("/bookings/me", response_model=List[schemas.Booking])
def get_my_bookings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()

@router.post("/bookings", response_model=schemas.Booking)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.balance < booking.total_price:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    new_booking = models.Booking(
        user_id=current_user.id,
        tour_id=booking.tour_id,
        date_range=booking.date_range,
        nights=booking.nights,
        people_count=booking.people_count,
        total_price=booking.total_price,
        status="Pending"
    )
    
    current_user.balance -= booking.total_price
    
    # Record transaction
    tour = db.query(models.Tour).filter(models.Tour.id == booking.tour_id).first()
    tour_title = tour.title if tour else "Тур"
    new_transaction = models.Transaction(
        user_id=current_user.id,
        amount=booking.total_price,
        type="payment",
        description=f"Оплата туру: {tour_title}"
    )
    
    db.add(new_booking)
    db.add(new_transaction)
    db.commit()
    db.refresh(new_booking)
    return new_booking

@router.post("/bookings/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
        
    # Refund balance
    current_user.balance += booking.total_price
    booking.status = "Cancelled"
    
    # Record refund transaction
    new_transaction = models.Transaction(
        user_id=current_user.id,
        amount=booking.total_price,
        type="refund",
        description=f"Повернення коштів за скасований тур (ID: {booking.tour_id})"
    )
    
    db.add(new_transaction)
    db.commit()
    return {"message": "Booking cancelled and refunded successfully", "new_balance": current_user.balance}

# Reviews
@router.get("/tours/{tour_id}/reviews", response_model=List[schemas.Review])
def get_tour_reviews(tour_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.tour_id == tour_id).order_by(models.Review.timestamp.desc()).all()

@router.post("/reviews", response_model=schemas.Review)
def create_review(
    review: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_review = models.Review(
        user_id=current_user.id,
        tour_id=review.tour_id,
        rating=review.rating,
        text=review.text
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    db.delete(review)
    db.commit()
    return {"ok": True}
