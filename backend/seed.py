from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models, auth_utils
from faker import Faker
import os
from dotenv import load_dotenv
import random
import sys
import argparse
import requests
from time import sleep

load_dotenv()

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "pomelo")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

fake = Faker(['uk_UA', 'en_US'])
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

REAL_CITIES = {
    "Ісландія": ["Рейк'явік", "Вік", "Скоугафосс"],
    "Швейцарія": ["Цюрих", "Люцерн", "Церматт"],
    "Італія": ["Рим", "Венеція", "Флоренція", "Позітано"],
    "Мальдіви": ["Мале", "Кураматі"],
    "Японія": ["Токіо", "Кіото", "Осака"],
    "Норвегія": ["Осло", "Берген", "Гейрангер"],
    "Індонезія": ["Убуд", "Семіньяк", "Улувату"],
    "Кенія": ["Найробі", "Масаї-Мара"],
    "Греція": ["Афіни", "Санторіні", "Родос"],
    "Франція": ["Париж", "Ніцца", "Шамоні"],
}

LOCATION_TRANSLATIONS = {
    "Ісландія": "Iceland", "Швейцарія": "Switzerland", "Італія": "Italy", "Мальдіви": "Maldives",
    "Японія": "Japan", "Норвегія": "Norway", "Індонезія": "Indonesia", "Кенія": "Kenya",
    "Греція": "Greece", "Франція": "France",
    "Рейк'явік": "Reykjavik", "Вік": "Vik", "Скоугафосс": "Skogafoss",
    "Цюрих": "Zurich", "Люцерн": "Lucerne", "Церматт": "Zermatt",
    "Рим": "Rome", "Венеція": "Venice", "Флоренція": "Florence", "Позітано": "Positano",
    "Мале": "Male", "Кураматі": "Kuramathi",
    "Токіо": "Tokyo", "Кіото": "Kyoto", "Осака": "Osaka",
    "Осло": "Oslo", "Берген": "Bergen", "Гейрангер": "Geiranger",
    "Убуд": "Ubud", "Семіньяк": "Seminyak", "Улувату": "Uluwatu",
    "Найробі": "Nairobi", "Масаї-Мара": "Maasai Mara",
    "Афіни": "Athens", "Санторіні": "Santorini", "Родос": "Rhodes",
    "Париж": "Paris", "Ніцца": "Nice", "Шамоні": "Chamonix"
}

TOUR_DATA_TEMPLATES = {
    "beach": {
        "uk": {
            "description": "Відпочинок на одному з найкращих курортів світу. Кришталево чиста вода, золотистий пісок та бездоганний сервіс чекають на вас.",
            "accommodation": "Комфортабельні номери категорії Standard або Deluxe з видом на море.",
            "flights": "Прямий авіапереліт авіакомпанією SkyUp або МАУ.",
            "program": "День 1: Приліт. День 2-6: Відпочинок. День 7: Виліт."
        },
        "en": {
            "description": "Relax at one of the world's finest resorts. Crystal clear waters and golden sands await.",
            "accommodation": "Comfortable Standard or Deluxe rooms with sea views.",
            "flights": "Direct flight with premium airlines.",
            "program": "Day 1: Arrival. Day 2-6: Relaxation. Day 7: Departure."
        }
    },
    "mountains": {
        "uk": {
            "description": "Відчуйте магію гірського повітря та неймовірні краєвиди.",
            "accommodation": "Затишні шале або номери в альпійському стилі.",
            "flights": "Авіапереліт + комфортабельний автобусний трансфер.",
            "program": "День 1: Приїзд. День 2-6: Гірські прогулянки. День 7: Виїзд."
        },
        "en": {
            "description": "Experience the magic of mountain air and breathtaking views.",
            "accommodation": "Cozy chalets or Alpine-style rooms.",
            "flights": "Flight + comfortable coach transfer.",
            "program": "Day 1: Arrival. Day 2-6: Exploration. Day 7: Departure."
        }
    },
    "city": {
        "uk": {
            "description": "Пориньте в атмосферу старовинного міста. Ідеально для поціновувачів історії.",
            "accommodation": "Бутік-готель у історичному центрі.",
            "flights": "Прямий регулярний рейс.",
            "program": "День 1: Прибуття. День 2-4: Екскурсії. День 5: Виліт."
        },
        "en": {
            "description": "Immerse yourself in the atmosphere of an ancient city.",
            "accommodation": "Boutique hotel in the historic center.",
            "flights": "Direct scheduled flight.",
            "program": "Day 1: Arrival. Day 2-4: Sightseeing. Day 5: Departure."
        }
    },
    "cruise": {
        "uk": {
            "description": "Ваша морська пригода починається тут. Сучасний лайнер та щодня новий порт.",
            "accommodation": "Каюти з балконом або вікном (Ocean view). Усе включено.",
            "flights": "Авіапереліт до порту відправлення.",
            "program": "День 1: Посадка. День 2-6: Круїз. День 7: Повернення."
        },
        "en": {
            "description": "Your sea adventure starts here. Multi-country trip on a modern liner.",
            "accommodation": "Ocean view cabins. All-inclusive service.",
            "flights": "Flight to departure port.",
            "program": "Day 1: Boarding. Day 2-6: Cruising. Day 7: Return."
        }
    },
    "safari": {
        "uk": {
            "description": "Зустріньтеся з дикою природою віч-на-віч. Ексклюзивне сафарі.",
            "accommodation": "Розкішний еко-лодж або кемпінг підвищеного комфорту.",
            "flights": "Міжнародний переліт + внутрішній переліт малою авіацією.",
            "program": "День 1: Прибуття. День 2-5: Сафарі. День 6: Виліт."
        },
        "en": {
            "description": "Meet wildlife face to face in their natural habitat.",
            "accommodation": "Luxury eco-lodge or glamping.",
            "flights": "International + domestic bush flights.",
            "program": "Day 1: Arrival. Day 2-5: Game drives. Day 6: Departure."
        }
    },
}

CATEGORY_DATA = [
    {"uk": "Пляж", "en": "Beach", "emoji": "beach", "keywords": ["beach", "tropical"]},
    {"uk": "Гори", "en": "Mountains", "emoji": "mountain", "keywords": ["mountains", "ski"]},
    {"uk": "Екскурсії", "en": "Excursions", "emoji": "map", "keywords": ["city", "museum"]},
    {"uk": "Круїзи", "en": "Cruises", "emoji": "ship", "keywords": ["cruise", "ship"]},
    {"uk": "Міста", "en": "Cities", "emoji": "city", "keywords": ["city", "architecture"]},
    {"uk": "Сафарі", "en": "Safari", "emoji": "lion", "keywords": ["safari", "savanna"]},
]

TOUR_TITLES = {
    "beach": [{"uk": "Розкішний відпочинок", "en": "Luxury Retreat"}, {"uk": "Лазурне узбережжя", "en": "Azure Coast"}],
    "mountains": [{"uk": "Альпійська експедиція", "en": "Alpine Expedition"}, {"uk": "Снігова вершина", "en": "Snowy Peak"}],
    "city": [{"uk": "Гранд відкриття", "en": "Grand Discovery"}, {"uk": "Спадщина та історія", "en": "Heritage & History"}],
    "cruise": [{"uk": "Захід сонця над океаном", "en": "Ocean Sunset"}, {"uk": "Середземноморська одіссея", "en": "Mediterranean Odyssey"}],
    "safari": [{"uk": "Сафарі на заході сонця", "en": "Sunset Safari"}, {"uk": "Серце дикої природи", "en": "Heart of the Wild"}]
}

CATEGORY_AMENITIES = {
    "beach": "pool,beach,restaurant,wifi,spa,party",
    "mountains": "mountain,skis,restaurant,wifi,spa,pool",
    "city": "city,restaurant,wifi,gym,spa,party",
    "cruise": "ship,pool,restaurant,wifi,spa,party,anchor",
    "safari": "lion,restaurant,wifi,gym,map,users-group"
}

def get_unsplash_photos(query, category=None):
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key: 
        print("Error: UNSPLASH_ACCESS_KEY not set in .env")
        return []
    
    # We want 4 with category, 4 without
    results = []
    try:
        url = "https://api.unsplash.com/search/photos"
        params = {"client_id": access_key, "per_page": 4, "orientation": "landscape"}
        
        # Request 1: With category
        q1 = f"{query} {category}" if category else query
        r1 = requests.get(url, params={**params, "query": q1}, timeout=10)
        if r1.status_code == 200:
            results.extend([p["urls"]["regular"] for p in r1.json().get("results", [])])
        
        # Request 2: Without category
        r2 = requests.get(url, params={**params, "query": query}, timeout=10)
        if r2.status_code == 200:
            for p in r2.json().get("results", []):
                url_str = p["urls"]["regular"]
                if url_str not in results:
                    results.append(url_str)
                    
    except Exception as e:
        print(f"Unsplash Request Error: {e}")
    return results[:8]

def seed_data(reset=False):
    db = SessionLocal()
    if reset:
        print("Resetting database (deleting data rows only)...")
        db.execute(models.user_favorites.delete())
        db.query(models.Review).delete()
        db.query(models.Booking).delete()
        db.query(models.ChatMessage).delete()
        db.query(models.Transaction).delete()
        db.query(models.Tour).delete()
        db.query(models.Category).delete()
        db.query(models.User).filter(models.User.email.like("user_%@%")).delete(synchronize_session=False)
        db.commit()
    
    print("Seeding categories...")
    db_categories = []
    for cat in CATEGORY_DATA:
        c = models.Category(name=cat["uk"], name_en=cat["en"], emoji=cat["emoji"])
        db.add(c)
        db.flush()
        db_categories.append({"obj": c, "keywords": cat["keywords"]})
    db.commit()

    print("Seeding tours (using Unsplash & curated locations)...")
    countries = list(REAL_CITIES.keys())
    COUNTRY_CAT_RULES = {
        "Ісландія": ["Гори", "Екскурсії"], "Швейцарія": ["Гори", "Міста"],
        "Італія": ["Міста", "Екскурсії", "Пляж"], "Мальдіви": ["Пляж", "Круїзи"],
        "Японія": ["Міста", "Екскурсії"], "Норвегія": ["Круїзи", "Гори"],
        "Індонезія": ["Пляж", "Сафарі"], "Кенія": ["Сафарі"],
        "Греція": ["Пляж", "Круїзи"], "Франція": ["Міста", "Пляж"]
    }

    all_tours = []
    for i in range(25):
        country = random.choice(countries)
        v_cats = COUNTRY_CAT_RULES.get(country, ["Пляж"])
        country_cats = [c for c in db_categories if c["obj"].name in v_cats] 
        cat_info = random.choice(country_cats)
        cat_key = cat_info["keywords"][0]
        
        city = random.choice(REAL_CITIES[country])
        c_en, l_en = LOCATION_TRANSLATIONS.get(country, country), LOCATION_TRANSLATIONS.get(city, city)
        
        tit_data = random.choice(TOUR_TITLES[cat_key])
        uk_title, en_title = f"{country} · {tit_data['uk']}", f"{c_en} · {tit_data['en']}"
        
        # Unsplash query split
        query_base = f"{l_en} {c_en}"
        photos = get_unsplash_photos(query_base, category=cat_key)
        img_url = photos[0] if photos else f"https://loremflickr.com/1200/800/travel,{cat_key}?random={i}"
        gallery = ",".join(photos[1:]) if photos else ",".join([f"https://loremflickr.com/1200/800/hotel?random={i*10+j}" for j in range(3)])

        tpl = TOUR_DATA_TEMPLATES[cat_key]
        badge = random.choice(["TOP", "АКЦІЯ", "НОВИНКА", None])
        price = random.randint(30000, 150000)
        original_price = None
        if badge == "АКЦІЯ":
            original_price = price * random.uniform(1.15, 1.25)
        
        tour = models.Tour(
            title=uk_title, title_en=en_title,
            location=f"{country} · {city}", location_en=f"{c_en} · {l_en}",
            description=tpl["uk"]["description"], description_en=tpl["en"]["description"],
            accommodation=tpl["uk"]["accommodation"], accommodation_en=tpl["en"]["accommodation"],
            flights=tpl["uk"]["flights"], flights_en=tpl["en"]["flights"],
            program=tpl["uk"]["program"], program_en=tpl["en"]["program"],
            price=price, original_price=original_price, stars=random.choice([4, 5]),
            image_url=img_url, gallery_urls=gallery, image_gradient=f"var(--grad-card-{random.randint(1,3)})",
            badge=badge, category_id=cat_info["obj"].id,
            meal_type=random.choice(["All Inclusive", "Breakfast Only", "Half Board"]),
            amenities=CATEGORY_AMENITIES.get(cat_key, "wifi,restaurant"),
            created_at=fake.date_time_between(start_date='-60d', end_date='now')
        )
        db.add(tour)
        db.flush()
        all_tours.append(tour)
    db.commit()

    print("Ensuring staff users...")
    def ensure(email, name, pwd, role):
        if not db.query(models.User).filter(models.User.email == email).first():
            db.add(models.User(email=email, full_name=name, hashed_password=auth_utils.get_password_hash(pwd), role=role, balance=1000000.0))
    ensure("admin@pomelo.ua", "Адміністратор", "admin123", "admin")
    ensure("manager@pomelo.ua", "Олексій Менеджер", "manager123", "manager")
    db.commit()

    print("Adding reviews and bookings...")
    mock_users = []
    for _ in range(5):
        u = models.User(email=f"user_{random.randint(1000,9999)}@example.com", full_name=fake.name(), hashed_password=auth_utils.get_password_hash("pass123"), role="user", balance=random.randint(50000, 300000))
        db.add(u); db.flush(); mock_users.append(u)
    
    for t in all_tours:
        for _ in range(random.randint(2, 4)):
            u = random.choice(mock_users)
            # Randomize interactions over a YEAR for better analytics
            created_date = fake.date_time_between(start_date='-365d', end_date='now')
            
            db.add(models.Review(
                user_id=u.id, tour_id=t.id, 
                rating=random.randint(4,5), text="Чудово!", 
                timestamp=created_date
            ))
            
            if random.random() > 0.7:
                db.add(models.Booking(
                    user_id=u.id, tour_id=t.id, date_range="Серпень 2025", 
                    nights=7, total_price=t.price, status="Confirmed",
                    created_at=created_date
                ))
                db.add(models.Transaction(
                    user_id=u.id, amount=t.price, type="payment", 
                    description=f"Оплата туру: {t.title}", 
                    timestamp=created_date
                ))
    
    db.commit()
    print("Done! Platform localized and prices updated 🍊")
    db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true")
    seed_data(reset=parser.parse_args().reset)
