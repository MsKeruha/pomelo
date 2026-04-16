from sqlalchemy.orm import Session
from database import SessionLocal
import models

def seed_settings():
    db = SessionLocal()
    try:
        defaults = [
            {"name": "commission_rate", "value": "10", "group": "financial"},
            {"name": "service_fee", "value": "500", "group": "financial"},
            {"name": "support_phone", "value": "+380 99 123 45 67", "group": "contacts"},
            {"name": "support_email", "value": "support@pomelo.travel", "group": "contacts"},
            {"name": "telegram_link", "value": "https://t.me/pomelo_travel", "group": "contacts"},
            {"name": "instagram_link", "value": "https://instagram.com/pomelo_travel", "group": "socials"},
            {"name": "facebook_link", "value": "https://facebook.com/pomelo_travel", "group": "socials"},
            {"name": "maintenance_mode", "value": "false", "group": "operations"},
        ]
        
        for d in defaults:
            exists = db.query(models.SystemSetting).filter(models.SystemSetting.name == d["name"]).first()
            if not exists:
                new_setting = models.SystemSetting(**d)
                db.add(new_setting)
        
        db.commit()
        print("Settings seeded successfully!")
    except Exception as e:
        print(f"Error seeding settings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_settings()
