import sys
from database import SessionLocal
import models
from auth_utils import get_password_hash

def create_admin(email, password, full_name="System Admin"):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"Error: User with email {email} already exists.")
            return

        hashed_password = get_password_hash(password)
        admin_user = models.User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print(f"Successfully created admin user: {email}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password>")
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        create_admin(email, password)
