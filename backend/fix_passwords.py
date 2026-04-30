import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add parent directory to path to import models and auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import auth_utils

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "pomelo")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_passwords():
    db = SessionLocal()
    try:
        # Find all users with the fake hash
        users_to_fix = db.query(models.User).filter(models.User.hashed_password == "fakehashedpassword").all()
        
        if not users_to_fix:
            print("No users with 'fakehashedpassword' found.")
            return

        print(f"Found {len(users_to_fix)} users to fix.")
        
        new_hash = auth_utils.get_password_hash("pass123")
        
        for user in users_to_fix:
            print(f"Fixing password for: {user.email}")
            user.hashed_password = new_hash
            
        db.commit()
        print("Successfully updated all passwords to hashed 'pass123'.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_passwords()
