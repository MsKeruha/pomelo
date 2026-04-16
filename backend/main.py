import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio
import os
import shutil
import httpx
from deep_translator import GoogleTranslator
from fastapi.concurrency import run_in_threadpool

import models, schemas, database, auth_utils
from database import engine, get_db

# Global settings and curated data
CURATED_LOCATIONS = {
    "Ісландія": {
        "en": "Iceland",
        "cities": {
            "Рейк'явік": "Reykjavik",
            "Вік": "Vik",
            "Скоугафосс": "Skogafoss"
        }
    },
    "Швейцарія": {
        "en": "Switzerland",
        "cities": {
            "Цюрих": "Zurich",
            "Люцерн": "Lucerne",
            "Церматт": "Zermatt"
        }
    },
    "Італія": {
        "en": "Italy",
        "cities": {
            "Рим": "Rome",
            "Венеція": "Venice",
            "Флоренція": "Florence",
            "Позітано": "Positano"
        }
    },
    "Мальдіви": {
        "en": "Maldives",
        "cities": {
            "Мале": "Male",
            "Кураматі": "Kuramathi"
        }
    },
    "Японія": {
        "en": "Japan",
        "cities": {
            "Токіо": "Tokyo",
            "Кіото": "Kyoto",
            "Осака": "Osaka"
        }
    },
    "Норвегія": {
        "en": "Norway",
        "cities": {
            "Осло": "Oslo",
            "Берген": "Bergen",
            "Гейрангер": "Geiranger"
        }
    },
    "Індонезія": {
        "en": "Indonesia",
        "cities": {
            "Убуд": "Ubud",
            "Семіньяк": "Seminyak",
            "Улувату": "Uluwatu"
        }
    },
    "Кенія": {
        "en": "Kenya",
        "cities": {
            "Найробі": "Nairobi",
            "Масаї-Мара": "Maasai Mara"
        }
    },
    "Греція": {
        "en": "Greece",
        "cities": {
            "Афіни": "Athens",
            "Санторіні": "Santorini",
            "Родос": "Rhodes"
        }
    },
    "Франція": {
        "en": "France",
        "cities": {
            "Париж": "Paris",
            "Ніцца": "Nice",
            "Шамоні": "Chamonix"
        }
    }
}

# Tables are managed via Alembic migrations

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- Dependencies ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth_utils.jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth_utils.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_staff(user: models.User = Depends(get_current_user)):
    if user.role not in ["admin", "manager", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

def get_current_admin(user: models.User = Depends(get_current_user)):
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Only admins can perform this action")
    return user

# --- Auth ---
@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_utils.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate confirmed bookings count
    count = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id,
        models.Booking.status == "Confirmed"
    ).count()
    current_user.bookings_count = count
    return current_user

# --- Chat ---
@app.post("/chat/send", response_model=schemas.ChatMessage)
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

@app.get("/chat/history", response_model=List[schemas.ChatMessage])
def get_chat_history(
    other_user_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If standard user, fetch conversation with staff
    if current_user.role == "user":
        return db.query(models.ChatMessage).filter(
            ((models.ChatMessage.sender_id == current_user.id) & (models.ChatMessage.is_from_staff == False)) |
            ((models.ChatMessage.receiver_id == current_user.id) & (models.ChatMessage.is_from_staff == True))
        ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    # If staff, fetch specific user history (bidirectional)
    if not other_user_id:
        raise HTTPException(status_code=400, detail="user_id is required for staff")

    return db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == other_user_id) & (models.ChatMessage.is_from_staff == False)) |
        ((models.ChatMessage.receiver_id == other_user_id) & (models.ChatMessage.is_from_staff == True))
    ).order_by(models.ChatMessage.timestamp.asc()).all()

@app.get("/staff/chats", response_model=List[schemas.UserResponse])
def get_all_user_chats(staff: models.User = Depends(get_current_staff), db: Session = Depends(get_db)):
    # Get users who have sent messages. In a real app index or aggregate.
    user_ids = db.query(models.ChatMessage.sender_id).filter(models.ChatMessage.is_from_staff == False).distinct().all()
    ids = [uid[0] for uid in user_ids]
    return db.query(models.User).filter(models.User.id.in_(ids)).all()

# --- Admin User Management ---
@app.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(role: Optional[str] = None, admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()

@app.post("/admin/users", response_model=schemas.UserResponse)
def create_admin_user(user: schemas.UserCreate, role: str = "manager", admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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

@app.delete("/admin/users/{user_id}", dependencies=[Depends(get_current_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    db.delete(db_user)
    db.commit()
    return {"ok": True}

# --- Categories & Tours ---

@app.post("/upload-image", dependencies=[Depends(get_current_staff)])
async def upload_image(file: UploadFile = File(...)):
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    # Return local backend URL, in real app would use proper host
    upload_base = os.getenv("UPLOAD_URL_BASE", "http://localhost:8000/uploads/")
    return {"url": f"{upload_base}{file.filename}"}

@app.get("/admin/search-photos", dependencies=[Depends(get_current_staff)])
async def admin_search_photos(query: str, category: Optional[str] = None):
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    
    if not access_key:
        raise HTTPException(
            status_code=500, 
            detail="Unsplash Access Key not configured."
        )
    
    # Translate query to English
    english_query = await translate_text(query, target='en')
    english_category = await translate_text(category, target='en') if category else None
    
    print(f"[DEBUG] Photo search input: '{query}' | Category: '{category}'")
    
    async with httpx.AsyncClient() as client:
        try:
            results = []
            
            # Request 1: With category (4 images)
            q1 = f"{english_query} {english_category}" if english_category else english_query
            print(f"[DEBUG] Unsplash Q1: '{q1}'")
            resp1 = await client.get(
                "https://api.unsplash.com/search/photos",
                params={"query": q1, "per_page": 4, "orientation": "landscape", "client_id": access_key},
                timeout=10
            )
            if resp1.status_code == 200:
                results.extend([p["urls"]["regular"] for p in resp1.json().get("results", [])])
            
            # Request 2: Without category (4 images)
            q2 = english_query
            print(f"[DEBUG] Unsplash Q2: '{q2}'")
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
            print(f"Unsplash Search Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

# --- Translation Helpers ---
async def translate_text(text: str, source: str = 'uk', target: str = 'en') -> str:
    if not text or not text.strip():
        return ""
    try:
        # Use run_in_threadpool because deep-translator is synchronous
        result = await run_in_threadpool(
            lambda: GoogleTranslator(source=source, target=target).translate(text)
        )
        return result
    except Exception as e:
        print(f"Translation error: {e}")
        return text # Fallback to original text

async def auto_translate_tour(tour_data_dict: dict):
    # Map of fields to translate
    fields_to_translate = [
        ('title', 'title_en'),
        ('description', 'description_en'),
        ('accommodation', 'accommodation_en'),
        ('flights', 'flights_en'),
        ('program', 'program_en')
    ]
    
    for uk_field, en_field in fields_to_translate:
        uk_val = tour_data_dict.get(uk_field)
        en_val = tour_data_dict.get(en_field)
        
        # Only translate if UK exists and EN is empty
        if uk_val and not en_val:
            translated = await translate_text(uk_val)
            tour_data_dict[en_field] = translated

@app.get("/locations/curated")
def get_curated_locations():
    """Returns the photogenic countries and cities used for high-quality tours."""
    return CURATED_LOCATIONS

@app.get("/tours", response_model=List[schemas.Tour])
def get_tours(category_id: int = None, trending: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Tour).options(joinedload(models.Tour.category))
    
    if category_id:
        query = query.filter(models.Tour.category_id == category_id)
        
    if trending:
        # Join with bookings, count them, and order by popularity
        query = (
            db.query(models.Tour)
            .options(selectinload(models.Tour.category))
            .outerjoin(models.Booking)
            .group_by(models.Tour.id)
            .order_by(func.count(models.Booking.id).desc())
        )
        if category_id:
            query = query.filter(models.Tour.category_id == category_id)
            
    return query.order_by(models.Tour.id.desc()).all()

@app.get("/tours/locations")
def get_tour_locations(db: Session = Depends(get_db)):
    # Extract unique location pairs from tours
    results = db.query(models.Tour.location, models.Tour.location_en).distinct().all()
    return [{"uk": r[0], "en": r[1]} for r in results]

@app.get("/tours/{tour_id}", response_model=schemas.Tour)
def get_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).options(joinedload(models.Tour.category)).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour

@app.post("/tours", response_model=schemas.Tour, dependencies=[Depends(get_current_staff)])
async def create_tour(tour: schemas.TourCreate, db: Session = Depends(get_db)):
    tour_data = tour.dict()
    await auto_translate_tour(tour_data)
    new_tour = models.Tour(**tour_data)
    db.add(new_tour)
    db.commit()
    db.refresh(new_tour)
    return new_tour

@app.put("/tours/{tour_id}", response_model=schemas.Tour, dependencies=[Depends(get_current_staff)])
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

@app.delete("/tours/{tour_id}", dependencies=[Depends(get_current_staff)])
def delete_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).filter(models.Tour.id == tour_id).first()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    db.delete(tour)
    db.commit()
    return {"ok": True}

# --- User Dashboard & Profile ---
@app.get("/bookings/me", response_model=List[schemas.Booking])
def get_my_bookings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()

@app.post("/bookings", response_model=schemas.Booking)
def create_booking(
    booking: schemas.BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_booking = models.Booking(
        user_id=current_user.id,
        tour_id=booking.tour_id,
        date_range=booking.date_range,
        nights=booking.nights,
        people_count=booking.people_count,
        total_price=booking.total_price,
        status="Confirmed" # Instant confirm for real feel if balance is enough
    )
    
    if current_user.balance < booking.total_price:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
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

@app.put("/users/update", response_model=schemas.UserResponse)
def update_user_profile(user_update: schemas.UserBase, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
    db_user.email = user_update.email
    db_user.full_name = user_update.full_name
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/admin/stats", dependencies=[Depends(get_current_staff)])
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

@app.get("/admin/stats/monthly", dependencies=[Depends(get_current_staff)])
def get_monthly_stats(db: Session = Depends(get_db)):
    # Returns last 12 months of bookings
    result = []
    now = datetime.utcnow()
    
    for i in range(11, -1, -1):
        # Calculate month and year for i months ago
        target_date = now.replace(day=1) - timedelta(days=i*30) # Rough estimate to get month index
        # Better: use proper month stepping
        month = (now.month - i - 1) % 12 + 1
        year = now.year + (now.month - i - 1) // 12
        
        # Filter bookings for this month/year
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
            "day": month_names[month - 1], # Keeping 'day' key for frontend compatibility, but value is month
            "val": int(count),
            "revenue": float(revenue),
            "is_current": (month == now.month and year == now.year)
        })
    return result

@app.get("/admin/bookings", response_model=List[schemas.Booking], dependencies=[Depends(get_current_staff)])
def get_all_bookings(db: Session = Depends(get_db)):
    return db.query(models.Booking).all()

@app.put("/admin/bookings/{booking_id}/status", response_model=schemas.Booking, dependencies=[Depends(get_current_staff)])
def update_booking_status(booking_id: int, status_update: schemas.BookingStatusUpdate, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = status_update.status
    db.commit()
    db.refresh(booking)
    return booking

@app.get("/admin/tours", response_model=List[schemas.Tour], dependencies=[Depends(get_current_staff)])
def get_all_tours_admin(db: Session = Depends(get_db)):
    return db.query(models.Tour).options(joinedload(models.Tour.category)).order_by(models.Tour.id.desc()).all()

# --- Reviews ---
@app.get("/tours/{tour_id}/reviews", response_model=List[schemas.Review])
def get_tour_reviews(tour_id: int, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.tour_id == tour_id).order_by(models.Review.timestamp.desc()).all()

@app.post("/reviews", response_model=schemas.Review)
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

@app.delete("/reviews/{review_id}")
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

# --- Favorites ---
@app.post("/favorites/{tour_id}")
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

@app.get("/favorites/me", response_model=List[schemas.Tour])
def get_my_favorites(current_user: models.User = Depends(get_current_user)):
    return current_user.favorites

# --- Wallet ---
@app.post("/users/me/topup")
def topup_balance(
    req: schemas.TopUpRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mocking card validation
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

@app.get("/users/me/transactions", response_model=List[schemas.TransactionResponse])
def get_my_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.timestamp.desc()).all()

# --- Exchange Rates (NBU API) ---
CACHE_RATES = {}
CACHE_TIME = None

@app.get("/exchange-rates", response_model=List[schemas.ExchangeRateResponse])
async def get_exchange_rates():
    global CACHE_RATES, CACHE_TIME
    
    # Cache for 1 hour
    if CACHE_TIME and (datetime.utcnow() - CACHE_TIME).total_seconds() < 3600:
        return list(CACHE_RATES.values())
    
    try:
        async with httpx.AsyncClient() as client:
            # NBU API returns all currencies for current date
            response = await client.get("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json")
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="NBU API unavailable")
            
            data = response.json()
            new_rates = {}
            for item in data:
                cc = item.get("cc") # Currency code: USD, EUR
                rate = item.get("rate")
                if cc in ["USD", "EUR"]:
                    new_rates[cc] = {
                        "currency": cc,
                        "rate": float(rate),
                        "timestamp": datetime.utcnow()
                    }
            
            if not new_rates:
                raise HTTPException(status_code=502, detail="Rates not found in NBU response")
                
            CACHE_RATES = new_rates
            CACHE_TIME = datetime.utcnow()
            return list(CACHE_RATES.values())
            
    except Exception as e:
        print(f"Currency fetch error: {e}")
        # Fallback to hardcoded or last known if API fails
        if CACHE_RATES:
            return list(CACHE_RATES.values())
        return [
            {"currency": "USD", "rate": 43.55, "timestamp": datetime.utcnow()},
            {"currency": "EUR", "rate": 51.29, "timestamp": datetime.utcnow()}
        ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
