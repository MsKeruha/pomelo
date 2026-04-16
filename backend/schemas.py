from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordForgotRequest(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

# User
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    balance: float = 0.0
    bookings_count: int = 0
    class Config:
        from_attributes = True

# Review
class ReviewBase(BaseModel):
    rating: int = 5
    text: str

class ReviewCreate(ReviewBase):
    tour_id: int

class Review(ReviewBase):
    id: int
    user_id: int
    tour_id: int
    timestamp: datetime
    user: Optional[UserResponse] = None
    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    amount: float
    type: str # deposit, payment
    description: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

class TopUpRequest(BaseModel):
    card_number: str
    card_expiry: str
    card_cvv: str
    amount: float

# Chat
class ChatMessageBase(BaseModel):
    content: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None # image / file

class ChatMessageCreate(ChatMessageBase):
    receiver_id: Optional[int] = None

class ChatMessage(ChatMessageBase):
    id: int
    sender_id: int
    receiver_id: Optional[int] = None
    is_from_staff: bool
    timestamp: datetime
    is_read: bool
    class Config:
        from_attributes = True

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    emoji: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# Tour
class TourBase(BaseModel):
    title: str
    title_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    location: str
    location_en: Optional[str] = None
    stars: Optional[int] = 5
    image_gradient: Optional[str] = None
    badge: Optional[str] = None
    gallery_urls: Optional[str] = None
    category_id: Optional[int] = None
    meal_type: Optional[str] = "All Inclusive"
    accommodation: Optional[str] = None
    accommodation_en: Optional[str] = None
    flights: Optional[str] = None
    flights_en: Optional[str] = None
    program: Optional[str] = None
    program_en: Optional[str] = None
    amenities: Optional[str] = "wifi,restaurant"
    available_dates: Optional[str] = None

class TourCreate(TourBase):
    pass

class TourUpdate(BaseModel):
    title: Optional[str] = None
    title_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    location: Optional[str] = None
    location_en: Optional[str] = None
    stars: Optional[int] = None
    image_gradient: Optional[str] = None
    badge: Optional[str] = None
    gallery_urls: Optional[str] = None
    category_id: Optional[int] = None
    meal_type: Optional[str] = None
    accommodation: Optional[str] = None
    accommodation_en: Optional[str] = None
    flights: Optional[str] = None
    flights_en: Optional[str] = None
    program: Optional[str] = None
    program_en: Optional[str] = None
    amenities: Optional[str] = None
    available_dates: Optional[str] = None

class Tour(TourBase):
    id: int
    reviews_count: int = 0
    average_rating: float = 0.0
    created_at: Optional[datetime] = None
    reviews: List[Review] = []
    category: Optional[Category] = None
    class Config:
        from_attributes = True

# Booking
class BookingCreate(BaseModel):
    tour_id: int
    date_range: Optional[str] = None
    nights: Optional[int] = 7
    people_count: Optional[str] = None
    total_price: Optional[float] = None

class BookingStatusUpdate(BaseModel):
    status: str  # Confirmed, Cancelled, Pending

class Booking(BaseModel):
    id: int
    user_id: int
    tour_id: int
    date_range: Optional[str] = None
    nights: Optional[int] = None
    people_count: Optional[str] = None
    total_price: Optional[float] = None
    status: str
    tour: Optional[Tour] = None
    user: Optional[UserResponse] = None
    class Config:
        from_attributes = True

class ExchangeRateResponse(BaseModel):
    currency: str
    rate: float # UAH per unit
    timestamp: datetime

class SystemSettingValue(BaseModel):
    value: str

class SystemSetting(BaseModel):
    name: str
    value: str
    group: str = "general"
    class Config:
        from_attributes = True
