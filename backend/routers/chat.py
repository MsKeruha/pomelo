from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas
from database import get_db
from dependencies import get_current_user, get_current_staff

router = APIRouter(tags=["chat"])

@router.post("/chat/send", response_model=schemas.ChatMessage)
def send_message(
    msg: schemas.ChatMessageCreate, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_msg = models.ChatMessage(
        sender_id=current_user.id,
        receiver_id=msg.receiver_id,
        content=msg.content,
        attachment_url=msg.attachment_url,
        attachment_type=msg.attachment_type,
        is_from_staff=current_user.role in ["admin", "manager", "superadmin"]
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.get("/chat/history", response_model=List[schemas.ChatMessage])
def get_chat_history(
    other_user_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "user":
        return db.query(models.ChatMessage).filter(
            ((models.ChatMessage.sender_id == current_user.id) & (models.ChatMessage.is_from_staff == False)) |
            ((models.ChatMessage.receiver_id == current_user.id) & (models.ChatMessage.is_from_staff == True))
        ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    if not other_user_id:
        raise HTTPException(status_code=400, detail="user_id обов'язковий")

    return db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == other_user_id) & (models.ChatMessage.is_from_staff == False)) |
        ((models.ChatMessage.receiver_id == other_user_id) & (models.ChatMessage.is_from_staff == True))
    ).order_by(models.ChatMessage.timestamp.asc()).all()

@router.get("/staff/chats", response_model=List[schemas.UserResponse])
def get_all_user_chats(staff: models.User = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Find all users who have sent messages to staff
    user_ids = db.query(models.ChatMessage.sender_id).filter(models.ChatMessage.is_from_staff == False).distinct().all()
    ids = [uid[0] for uid in user_ids]
    
    users = db.query(models.User).filter(models.User.id.in_(ids)).all()
    
    # Add unread count for each user
    for user in users:
        unread = db.query(models.ChatMessage).filter(
            models.ChatMessage.sender_id == user.id,
            models.ChatMessage.is_from_staff == False,
            models.ChatMessage.is_read == False
        ).count()
        user.unread_count = unread
        
    return users

@router.post("/chat/read/{user_id}")
def mark_messages_as_read(
    user_id: int,
    staff: models.User = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    db.query(models.ChatMessage).filter(
        models.ChatMessage.sender_id == user_id,
        models.ChatMessage.is_from_staff == False,
        models.ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}
