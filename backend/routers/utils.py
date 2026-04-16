from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
import httpx

from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(tags=["utils"])

@router.get("/settings/public")
def get_public_settings(db: Session = Depends(get_db)):
    # Return settings that are safe for everyone to see
    public_keys = ["support_phone", "support_email", "telegram_link", "instagram_link", "facebook_link", "maintenance_mode", "service_fee"]
    settings = db.query(models.SystemSetting).filter(models.SystemSetting.name.in_(public_keys)).all()
    return {s.name: s.value for s in settings}

CACHE_RATES = {}
CACHE_TIME = None

@router.get("/exchange-rates", response_model=List[schemas.ExchangeRateResponse])
async def get_exchange_rates():
    global CACHE_RATES, CACHE_TIME
    
    # 60min cache
    if CACHE_TIME and (datetime.utcnow() - CACHE_TIME).total_seconds() < 3600:
        return list(CACHE_RATES.values())
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json")
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="NBU API unavailable")
            
            data = response.json()
            new_rates = {}
            for item in data:
                cc = item.get("cc")
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
        if CACHE_RATES:
            return list(CACHE_RATES.values())
        return [
            {"currency": "USD", "rate": 43.55, "timestamp": datetime.utcnow()},
            {"currency": "EUR", "rate": 51.29, "timestamp": datetime.utcnow()}
        ]
