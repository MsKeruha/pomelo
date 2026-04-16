import os
import httpx
from deep_translator import GoogleTranslator
from fastapi.concurrency import run_in_threadpool

async def translate_text(text: str, source: str = 'uk', target: str = 'en') -> str:
    if not text or not text.strip():
        return ""
    try:
        # run in pool since deep-translator is sync
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
