from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Enum, DateTime, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

user_favorites = Table(
    "user_favorites",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("tour_id", Integer, ForeignKey("tours.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user") # user, manager, admin
    balance = Column(Float, default=0.0, nullable=False)
    avatar_url = Column(String, nullable=True)
    
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Tour", secondary=user_favorites, back_populates="favorited_by")
    sent_messages = relationship("ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("ChatMessage", foreign_keys="ChatMessage.receiver_id", back_populates="receiver", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True) # null if addressed to staff
    content = Column(String, nullable=False)
    attachment_url = Column(String, nullable=True)
    attachment_type = Column(String, nullable=True) # image, file
    is_from_staff = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    name_en = Column(String) # localize
    emoji = Column(String) # icon name
    
    tours = relationship("Tour", back_populates="category")

class Tour(Base):
    __tablename__ = "tours"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    title_en = Column(String) 
    location = Column(String, nullable=False)
    location_en = Column(String) 
    description = Column(String)
    description_en = Column(String) 
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True) # price before discount
    stars = Column(Integer, default=5)
    image_url = Column(String)
    gallery_urls = Column(String) # csv list
    image_gradient = Column(String) # css var
    badge = Column(String) # TOP, АКЦІЯ etc
    meal_type = Column(String) 
    accommodation = Column(String) 
    accommodation_en = Column(String) 
    flights = Column(String) 
    flights_en = Column(String) 
    program = Column(String) 
    program_en = Column(String) 
    amenities = Column(String, default="wifi,restaurant") 
    available_dates = Column(String) 
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="tours")
    bookings = relationship("Booking", back_populates="tour", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="tour", cascade="all, delete-orphan")
    favorited_by = relationship("User", secondary=user_favorites, back_populates="favorites")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    @property
    def reviews_count(self):
        return len(self.reviews) if self.reviews else 0
        
    @property
    def average_rating(self):
        if not self.reviews:
            return 0.0
        return sum(r.rating for r in self.reviews) / len(self.reviews)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tour_id = Column(Integer, ForeignKey("tours.id"))
    
    date_range = Column(String) # e.g. "14–21 серпня 2025"
    nights = Column(Integer)
    people_count = Column(String) # e.g. "2 дорослих"
    total_price = Column(Float)
    status = Column(String, default="Pending") # Pending, Confirmed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    tour = relationship("Tour", back_populates="bookings")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tour_id = Column(Integer, ForeignKey("tours.id"))
    rating = Column(Integer, default=5)
    text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    tour = relationship("Tour", back_populates="reviews")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    type = Column(String) # deposit, payment
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    name = Column(String, primary_key=True, index=True)
    value = Column(String)
    group = Column(String, default="general")
