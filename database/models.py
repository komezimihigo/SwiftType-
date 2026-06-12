import sqlite3

DATABASE = 'typing_a.db'


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ==================== TABLES ====================

def create_tables():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            wpm REAL NOT NULL,
            raw_wpm REAL NOT NULL,
            accuracy REAL NOT NULL,
            errors INTEGER NOT NULL,
            test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS error_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            character TEXT NOT NULL,
            error_count INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, character)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            country TEXT,
            city TEXT,
            user_agent TEXT,
            visit_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_logged_in BOOLEAN DEFAULT 0,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            message_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()


# ==================== USER ====================

def create_user(username, email, password, is_admin=False):
    conn = get_db()
    cursor = conn.cursor()

    # 🔥 check if this is first user
    count = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    # first user becomes admin automatically
    if count == 0:
        is_admin = True

    try:
        cursor.execute(
            'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
            (username, email, password, int(is_admin))
        )

        conn.commit()
        return {
            'success': True,
            'user_id': cursor.lastrowid
        }
    except sqlite3.IntegrityError:
        return {
            'success': False,
            'error': 'Username or email already exists'
        }
    finally:
        conn.close()

def get_user(username):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
    conn.close()
    return dict(user) if user else None


def get_user_by_id(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id=?', (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None


def get_all_users():
    conn = get_db()
    users = conn.execute(
        'SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    return [dict(u) for u in users]


def set_admin(user_id, is_admin):
    conn = get_db()
    conn.execute(
        'UPDATE users SET is_admin=? WHERE id=?',
        (int(is_admin), user_id)
    )
    conn.commit()
    conn.close()


def is_admin(user_id):
    conn = get_db()
    result = conn.execute(
        'SELECT is_admin FROM users WHERE id=?',
        (user_id,)
    ).fetchone()
    conn.close()
    return result and result['is_admin'] == 1


# ==================== RESULTS ====================

def save_result(user_id, wpm, accuracy, errors, raw_wpm):
    conn = get_db()
    conn.execute(
        'INSERT INTO results (user_id, wpm, raw_wpm, accuracy, errors) VALUES (?, ?, ?, ?, ?)',
        (user_id, wpm, raw_wpm, accuracy, errors)
    )
    conn.commit()
    conn.close()


def get_user_results(user_id, limit=50):
    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM results WHERE user_id=? ORDER BY test_date DESC LIMIT ?',
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_results(limit=100):
    conn = get_db()
    rows = conn.execute('''
        SELECT r.*, u.username
        FROM results r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.test_date DESC LIMIT ?
    ''', (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_user_stats(user_id):
    conn = get_db()
    stats = conn.execute('''
        SELECT COUNT(*) as total_tests,
               AVG(wpm) as avg_wpm,
               MAX(wpm) as best_wpm,
               AVG(accuracy) as avg_accuracy
        FROM results WHERE user_id=?
    ''', (user_id,)).fetchone()
    conn.close()
    return dict(stats)


def get_all_stats():
    conn = get_db()
    rows = conn.execute('''
        SELECT u.id, u.username,
               COUNT(r.id) as total_tests,
               AVG(r.wpm) as avg_wpm
        FROM users u
        LEFT JOIN results r ON u.id = r.user_id
        GROUP BY u.id
    ''').fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== ERROR ====================

def log_error(user_id, character):
    conn = get_db()
    conn.execute('''
        INSERT INTO error_log (user_id, character, error_count)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, character)
        DO UPDATE SET error_count = error_count + 1
    ''', (user_id, character))
    conn.commit()
    conn.close()


def get_weak_keys(user_id, limit=10):
    conn = get_db()
    rows = conn.execute('''
        SELECT character, error_count
        FROM error_log
        WHERE user_id=?
        ORDER BY error_count DESC LIMIT ?
    ''', (user_id, limit)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== VISITORS ====================

def log_visitor(ip, country=None, city=None, agent=None, user_id=None):
    conn = get_db()
    conn.execute('''
        INSERT INTO visitors (ip_address, country, city, user_agent, is_logged_in, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (ip, country, city, agent, 1 if user_id else 0, user_id))
    conn.commit()
    conn.close()


def get_recent_visitors(limit=50):
    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM visitors ORDER BY visit_timestamp DESC LIMIT ?',
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_visitor_stats():
    conn = get_db()
    total = conn.execute('SELECT COUNT(*) FROM visitors').fetchone()[0]
    conn.close()
    return {'total_visits': total}


def get_top_countries():
    conn = get_db()
    rows = conn.execute('''
        SELECT country, COUNT(*) as visits
        FROM visitors GROUP BY country ORDER BY visits DESC LIMIT 10
    ''').fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== CHAT ====================

def save_chat_message(user_id, msg, ai):
    conn = get_db()
    conn.execute(
        'INSERT INTO chat_messages (user_id, user_message, ai_response) VALUES (?, ?, ?)',
        (user_id, msg, ai)
    )
    conn.commit()
    conn.close()


def get_chat_history(user_id, limit=20):
    conn = get_db()
    rows = conn.execute('''
        SELECT user_message, ai_response, message_timestamp
        FROM chat_messages
        WHERE user_id=? ORDER BY message_timestamp DESC LIMIT ?
    ''', (user_id, limit)).fetchall()
    conn.close()
    return list(reversed([dict(r) for r in rows]))

def get_user_by_email(email):
    conn = get_db()
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )

    user = cursor.fetchone()

    conn.close()

    if user:
        return dict(user)

    return None

