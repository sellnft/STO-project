# test_db.py
import asyncio
from sqlalchemy import text
from database import engine, async_session_maker

async def test_connection():
    try:
        # Способ 1: Проверка через движок
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            print(f"✅ Подключение успешно! Результат: {result.fetchone().test}")
        
        # Способ 2: Проверка через сессию
        async with async_session_maker() as session:
            result = await session.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL версия: {version[:50]}...")
            
            # Проверяем таблицы
            result = await session.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = result.fetchall()
            if tables:
                print(f"\n✅ Найдены таблицы:")
                for table in tables:
                    print(f"   - {table[0]}")
            else:
                print("\n⚠️ Таблицы не найдены")
                
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await engine.dispose()
        print("\n🔌 Соединение закрыто")

if __name__ == "__main__":
    asyncio.run(test_connection())