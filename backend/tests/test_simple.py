import requests
import time

API_BASE = "http://127.0.0.1:8000"


def test_get_defects():
    response = requests.get(f"{API_BASE}/owner/defects")
    assert response.status_code == 200
    print("GET /owner/defects OK")


def test_full_flow():
    """Полный сценарий: регистрация -> анкета -> заявка -> логин механика -> взятие -> завершение"""
    
    # 1. Создаём владельца
    owner_username = f"owner_{int(time.time())}"
    print(f"\n1. Регистрация владельца: {owner_username}")
    
    reg_resp = requests.post(f"{API_BASE}/register", data={
        "username": owner_username,
        "password": "123456",
        "role": "owner"
    })
    assert reg_resp.status_code == 200, f"Ошибка регистрации: {reg_resp.text}"
    owner_id = reg_resp.json()["id"]
    print(f"   Владелец создан, ID: {owner_id}")
    
    # 2. Заполняем анкету владельца
    print(f"2. Заполнение анкеты владельца")
    owner_data = {
        "full_name": "Тестов Тест Тестович",
        "address": "г. Москва, ул. Тестовая, д. 1",
        "age": 30,
        "passport_number": "1234567890",
        "phone": "79991234567"
    }
    owner_resp = requests.post(f"{API_BASE}/register/owners?user_id={owner_id}", data=owner_data)
    assert owner_resp.status_code == 200, f"Ошибка анкеты: {owner_resp.text}"
    print(f"   Анкета заполнена")
    
    # 3. Логин владельца и создание заявки
    print(f"3. Логин владельца")
    login_resp = requests.post(f"{API_BASE}/register/login", data={
        "username": owner_username,
        "password": "123456"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    print(f"   Токен получен")
    
    print(f"4. Создание заявки")
    plate = f"X{int(time.time())}"[-8:]
    repair_data = {
        "brand": "Toyota",
        "color": "Red",
        "year": 2020,
        "license_plate": plate,
        "description": "Тестовая заявка на ремонт",
        "defect_ids": []
    }
    headers = {"Authorization": f"Bearer {token}"}
    repair_resp = requests.post(f"{API_BASE}/owner/new_application", json=repair_data, headers=headers)
    assert repair_resp.status_code == 201, f"Ошибка создания заявки: {repair_resp.text}"
    repair_id = repair_resp.json()["repair_id"]
    print(f"   Заявка создана, ID: {repair_id}")
    
    # 5. Создаём механика
    mechanic_username = f"mechanic_{int(time.time())}"
    print(f"5. Регистрация механика: {mechanic_username}")
    
    mech_reg = requests.post(f"{API_BASE}/register", data={
        "username": mechanic_username,
        "password": "123456",
        "role": "mechanic"
    })
    assert mech_reg.status_code == 200
    mechanic_id = mech_reg.json()["id"]
    print(f"   Механик создан, ID: {mechanic_id}")
    
    # 6. Заполняем анкету механика
    print(f"6. Заполнение анкеты механика")
    mech_data = {
        "full_name": "Тестов Механик Тестович",
        "specialization": "Автомеханик",
        "rank": 5
    }
    mech_owner = requests.post(f"{API_BASE}/register/employees?user_id={mechanic_id}", data=mech_data)
    assert mech_owner.status_code == 200, f"Ошибка анкеты механика: {mech_owner.text}"
    print(f"   Анкета механика заполнена")
    
    # 7. Логин механика и взятие заявки
    print(f"7. Логин механика")
    mech_login = requests.post(f"{API_BASE}/register/login", data={
        "username": mechanic_username,
        "password": "123456"
    })
    assert mech_login.status_code == 200
    mech_token = mech_login.json()["access_token"]
    mech_headers = {"Authorization": f"Bearer {mech_token}"}
    
    print(f"8. Взятие заявки в работу")
    take_resp = requests.post(f"{API_BASE}/mechanic/take-application/{repair_id}", headers=mech_headers)
    assert take_resp.status_code == 200, f"Ошибка взятия заявки: {take_resp.text}"
    print(f"   Заявка взята в работу")
    
    # 9. Завершение ремонта
    print(f"9. Завершение ремонта")
    complete_data = {"work_cost": 5000, "parts_cost": 2500}
    complete_resp = requests.post(f"{API_BASE}/mechanic/end-application/{repair_id}", json=complete_data, headers=mech_headers)
    assert complete_resp.status_code == 200, f"Ошибка завершения: {complete_resp.text}"
    print(f"   Ремонт завершён, стоимость: 5000 + 2500")
    
    print(f"\nПолный цикл пройден успешно!")


if __name__ == "__main__":
    print("\n=== ЗАПУСК ТЕСТОВ ===\n")
    
    try:
        test_get_defects()
        test_full_flow()
        print("\n=== ВСЕ ТЕСТЫ ПРОЙДЕНЫ ===")
    except Exception as e:
        print(f"\n ОШИБКА: {e}")
        import traceback
        traceback.print_exc()