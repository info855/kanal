import random
import string
from datetime import datetime

def generate_order_id():
    """Generate unique order ID"""
    timestamp = datetime.now().strftime("%Y%m")
    random_num = ''.join(random.choices(string.digits, k=4))
    return f"KRG-{timestamp}-{random_num}"

def generate_tracking_code():
    """Generate unique tracking code"""
    return 'TRK' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))

def get_status_text(status: str) -> str:
    """Get Turkish status text"""
    status_map = {
        "created": "Sipariş Oluşturuldu",
        "picked": "Kargo Alındı",
        "in_transit": "Transfer Merkezinde",
        "out_for_delivery": "Dağıtıma Çıktı",
        "delivered": "Teslim Edildi"
    }
    return status_map.get(status, "Bilinmiyor")

def get_default_location(city: str):
    """Get default coordinates for cities"""
    city_coords = {
        "istanbul": {"lat": 41.0082, "lng": 28.9784},
        "ankara": {"lat": 39.9334, "lng": 32.8597},
        "izmir": {"lat": 38.4192, "lng": 27.1287},
        "bursa": {"lat": 40.1826, "lng": 29.0665},
        "antalya": {"lat": 36.8969, "lng": 30.7133}
    }
    default_coords = {"lat": 39.9334, "lng": 32.8597}  # Default to Ankara
    return city_coords.get(city.lower(), default_coords)
