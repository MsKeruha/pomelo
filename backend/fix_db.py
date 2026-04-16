from database import SessionLocal
import models

def fix_balances():
    db = SessionLocal()
    try:
        users_with_none_balance = db.query(models.User).filter(models.User.balance == None).all()
        if users_with_none_balance:
            print(f"Found {len(users_with_none_balance)} users with NULL balance. Fixing...")
            for user in users_with_none_balance:
                user.balance = 0.0
            db.commit()
            print("Balances fixed successully.")
        else:
            print("No users with NULL balance found.")
    except Exception as e:
        print(f"Error fixing balances: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_balances()
