-- ============================================================
-- DATABASE SCHEMA - Library Management System
-- PostgreSQL 15+
-- ============================================================

-- Tạo database (chạy riêng nếu cần)
-- CREATE DATABASE library_db;

-- ============================================================
-- 1. BẢNG roles — Vai trò người dùng
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Vai trò người dùng';
COMMENT ON COLUMN roles.name IS 'library_admin | librarian | reader';

-- ============================================================
-- 2. BẢNG users — Tài khoản người dùng
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    locked_reason   TEXT,
    last_login      TIMESTAMP,
    role_id         INTEGER REFERENCES roles(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Tài khoản người dùng (admin, librarian, reader)';
COMMENT ON COLUMN users.is_active IS 'Trạng thái hoạt động';
COMMENT ON COLUMN users.locked_reason IS 'Lý do khóa tài khoản (nếu có)';

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ============================================================
-- 3. BẢNG user_profiles — Hồ sơ chi tiết người dùng
-- ============================================================
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(255),
    phone           VARCHAR(255),
    id_card_number  VARCHAR(255),
    date_of_birth   DATE,
    address         VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Hồ sơ chi tiết người dùng (1-1 với users)';

-- ============================================================
-- 4. BẢNG categories — Danh mục sách
-- ============================================================
CREATE TABLE categories (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL UNIQUE
);

COMMENT ON TABLE categories IS 'Danh mục sách';

-- ============================================================
-- 5. BẢNG books — Đầu sách
-- ============================================================
CREATE TABLE books (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn             VARCHAR(255) NOT NULL UNIQUE,
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    publisher        VARCHAR(255),
    category_id      INTEGER NOT NULL REFERENCES categories(id),
    publish_year     INTEGER,
    description      TEXT,
    cover_url        VARCHAR(255),
    total_copies     INTEGER DEFAULT 0,
    available_copies INTEGER DEFAULT 0,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE books IS 'Đầu sách';
COMMENT ON COLUMN books.total_copies IS 'Tổng số bản sao';
COMMENT ON COLUMN books.available_copies IS 'Số bản sao còn có thể mượn';

CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);

-- ============================================================
-- 6. BẢNG book_copies — Bản sao sách
-- ============================================================
CREATE TABLE book_copies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id     UUID NOT NULL REFERENCES books(id),
    copy_code   VARCHAR(255) NOT NULL UNIQUE,
    condition   VARCHAR(50) DEFAULT 'new'
                CHECK (condition IN ('new','good','fair','poor','damaged')),
    status      VARCHAR(50) DEFAULT 'available'
                CHECK (status IN ('available','borrowed','lost','disposed','reserved')),
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE book_copies IS 'Bản sao sách (mỗi cuốn sách vật lý)';
COMMENT ON COLUMN book_copies.condition IS 'Tình trạng: new | good | fair | poor | damaged';
COMMENT ON COLUMN book_copies.status IS 'Trạng thái: available | borrowed | lost | disposed | reserved';

CREATE INDEX idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX idx_book_copies_status ON book_copies(status);

-- ============================================================
-- 7. BẢNG library_cards — Thẻ thư viện
-- ============================================================
CREATE TABLE library_cards (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL UNIQUE REFERENCES users(id),
    issued_by     UUID REFERENCES users(id),
    card_number   VARCHAR(255) NOT NULL UNIQUE,
    issued_date   DATE NOT NULL,
    expiry_date   DATE NOT NULL,
    status        VARCHAR(50) DEFAULT 'pending'
                  CHECK (status IN ('pending','active','expired','locked','rejected')),
    created_at    TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE library_cards IS 'Thẻ thư viện';
COMMENT ON COLUMN library_cards.status IS 'pending | active | expired | locked | rejected';

CREATE INDEX idx_library_cards_user_id ON library_cards(user_id);
CREATE INDEX idx_library_cards_card_number ON library_cards(card_number);

-- ============================================================
-- 8. BẢNG borrow_records — Phiếu mượn/trả
-- ============================================================
CREATE TABLE borrow_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_card_id     UUID NOT NULL REFERENCES library_cards(id),
    book_copy_id        UUID NOT NULL REFERENCES book_copies(id),
    librarian_id        UUID REFERENCES users(id),
    borrow_date         DATE NOT NULL,
    due_date            DATE NOT NULL,
    return_date         DATE,
    status              VARCHAR(50) DEFAULT 'borrowing'
                        CHECK (status IN ('borrowing','returned','overdue','lost')),
    return_requested    BOOLEAN DEFAULT FALSE,
    return_requested_at TIMESTAMP,
    renewal_count       INTEGER DEFAULT 0,
    original_due_date   DATE,
    renewed_at          TIMESTAMP,
    renewed_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE borrow_records IS 'Phiếu mượn/trả sách';
COMMENT ON COLUMN borrow_records.status IS 'borrowing | returned | overdue | lost';
COMMENT ON COLUMN borrow_records.return_requested IS 'Độc giả yêu cầu trả sách (snooze)';

CREATE INDEX idx_borrow_records_library_card_id ON borrow_records(library_card_id);
CREATE INDEX idx_borrow_records_book_copy_id ON borrow_records(book_copy_id);
CREATE INDEX idx_borrow_records_status ON borrow_records(status);

-- ============================================================
-- 9. BẢNG borrow_requests — Yêu cầu mượn sách
-- ============================================================
CREATE TABLE borrow_requests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_card_id   UUID NOT NULL REFERENCES library_cards(id),
    book_id           UUID NOT NULL REFERENCES books(id),
    status            VARCHAR(50) DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','rejected','cancelled')),
    requested_at      TIMESTAMP DEFAULT NOW(),
    processed_at      TIMESTAMP,
    processed_by      UUID REFERENCES users(id),
    rejection_reason  VARCHAR(255),
    borrow_record_id  UUID
);

COMMENT ON TABLE borrow_requests IS 'Yêu cầu mượn sách của độc giả';
COMMENT ON COLUMN borrow_requests.status IS 'pending | approved | rejected | cancelled';

CREATE INDEX idx_borrow_requests_library_card_id ON borrow_requests(library_card_id);
CREATE INDEX idx_borrow_requests_book_id ON borrow_requests(book_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);

-- ============================================================
-- 10. BẢNG reservations — Đặt trước sách
-- ============================================================
CREATE TABLE reservations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_card_id   UUID NOT NULL REFERENCES library_cards(id),
    book_id           UUID NOT NULL REFERENCES books(id),
    reserved_copy_id  UUID REFERENCES book_copies(id),
    queue_position    INTEGER DEFAULT 1,
    status            VARCHAR(50) DEFAULT 'waiting'
                      CHECK (status IN ('waiting','notified','completed','cancelled','expired')),
    reserved_at       TIMESTAMP DEFAULT NOW(),
    notified_at       TIMESTAMP,
    expires_at        TIMESTAMP
);

COMMENT ON TABLE reservations IS 'Đặt trước sách';
COMMENT ON COLUMN reservations.status IS 'waiting | notified | completed | cancelled | expired';
COMMENT ON COLUMN reservations.queue_position IS 'Vị trí trong hàng đợi';

CREATE INDEX idx_reservations_library_card_id ON reservations(library_card_id);
CREATE INDEX idx_reservations_book_id ON reservations(book_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- ============================================================
-- 11. BẢNG fines — Tiền phạt
-- ============================================================
CREATE TABLE fines (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrow_record_id  UUID NOT NULL REFERENCES borrow_records(id),
    fine_type         VARCHAR(50) DEFAULT 'overdue'
                      CHECK (fine_type IN ('overdue','damaged','lost')),
    overdue_days      INTEGER DEFAULT 0,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0,
    status            VARCHAR(50) DEFAULT 'pending'
                      CHECK (status IN ('pending','paid','waived')),
    collected_by      UUID REFERENCES users(id),
    payment_method    VARCHAR(255),
    receipt_number    VARCHAR(255),
    paid_at           TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE fines IS 'Tiền phạt (quá hạn / hư hỏng / mất sách)';
COMMENT ON COLUMN fines.fine_type IS 'overdue | damaged | lost';
COMMENT ON COLUMN fines.status IS 'pending | paid | waived';
COMMENT ON COLUMN fines.payment_method IS 'Phương thức thanh toán (VNPay, tiền mặt, ...)';

CREATE INDEX idx_fines_borrow_record_id ON fines(borrow_record_id);
CREATE INDEX idx_fines_status ON fines(status);

-- ============================================================
-- 12. BẢNG notifications — Thông báo
-- ============================================================
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type   VARCHAR(255) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    target_group        VARCHAR(255),
    custom_recipients   VARCHAR(255),
    recipient_count     INTEGER DEFAULT 0,
    sent_count          INTEGER DEFAULT 0,
    channel             VARCHAR(255) DEFAULT 'email',
    status              VARCHAR(255) DEFAULT 'draft'
                        CHECK (status IN ('draft','sent')),
    user_id             UUID,  -- NULL = thông báo bulk
    read                BOOLEAN DEFAULT FALSE,
    variables           TEXT[],  -- mảng biến cho template
    sent_at             TIMESTAMP,
    created_by_id       UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Thông báo (bulk email, cá nhân, ...)';
COMMENT ON COLUMN notifications.notification_type IS 'bulk | test | individual | account_lock';
COMMENT ON COLUMN notifications.target_group IS 'all | overdue | expiring | debt';
COMMENT ON COLUMN notifications.channel IS 'Kênh gửi: email';
COMMENT ON COLUMN notifications.status IS 'draft | sent';
COMMENT ON COLUMN notifications.variables IS 'Biến template, VD: {{tên_độc_giả}}, {{số_ngày}}';

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_by_id ON notifications(created_by_id);

-- ============================================================
-- 13. BẢNG shifts — Ca làm việc của thủ thư
-- ============================================================
CREATE TABLE shifts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    librarian_id    UUID NOT NULL REFERENCES users(id),
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    note            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'Ca làm việc của thủ thư';

CREATE INDEX idx_shifts_librarian_id ON shifts(librarian_id);

-- ============================================================
-- 14. BẢNG password_resets — Token đặt lại mật khẩu
-- ============================================================
CREATE TABLE password_resets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE password_resets IS 'Token đặt lại mật khẩu';

CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token);

-- ============================================================
-- 15. BẢNG system_config — Cấu hình hệ thống
-- ============================================================
CREATE TABLE system_config (
    id          SERIAL PRIMARY KEY,
    key         VARCHAR(255) NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE system_config IS 'Cấu hình hệ thống (key-value)';


-- ============================================================
-- SEED DATA — Dữ liệu mẫu
-- ============================================================

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
    (1, 'library_admin', 'Library Administrator'),
    (2, 'librarian', 'Librarian'),
    (3, 'reader', 'Reader');

-- 2. Users (password = 'password123')
-- BCrypt hash of 'password123'
INSERT INTO users (id, username, email, password_hash, is_active, role_id, created_at) VALUES
    ('a0000000-0000-4000-8000-000000000001', 'admin',      'admin@library.vn',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, 1, '2024-01-01T00:00:00Z'),
    ('a0000000-0000-4000-8000-000000000002', 'librarian',  'librarian@library.vn',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, 2, '2024-01-02T00:00:00Z'),
    ('a0000000-0000-4000-8000-000000000003', 'reader',     'reader@example.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, 3, '2024-01-10T00:00:00Z'),
    ('a0000000-0000-4000-8000-000000000004', 'reader2',    'reader2@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', TRUE, 3, '2024-02-01T00:00:00Z');

-- 3. User Profiles
INSERT INTO user_profiles (user_id, full_name, phone, id_card_number, date_of_birth, address) VALUES
    ('a0000000-0000-4000-8000-000000000001', 'Quản trị viên',      NULL,           NULL,            NULL,           NULL),
    ('a0000000-0000-4000-8000-000000000002', 'Nguyễn Thị Lan',     '0901234567',   NULL,            NULL,           NULL),
    ('a0000000-0000-4000-8000-000000000003', 'Trần Văn Minh',      '0912345678',   '012345678901', '1998-05-15',   '123 Đường Nguyễn Huệ, Q.1, TP.HCM'),
    ('a0000000-0000-4000-8000-000000000004', 'Lê Thị Hoa',         '0923456789',   '098765432100', '2000-08-20',   '456 Lê Lợi, Q.3, TP.HCM');

-- 4. Categories
INSERT INTO categories (id, name) VALUES
    (1, 'Tiểu thuyết'),
    (2, 'Kỹ năng sống'),
    (3, 'Lịch sử'),
    (4, 'Công nghệ'),
    (5, 'Tâm lý học'),
    (6, 'Khoa học'),
    (7, 'Văn học Việt Nam'),
    (8, 'Kinh tế - Tài chính');

-- 5. Books
INSERT INTO books (id, isbn, title, author, publisher, category_id, publish_year, description, total_copies, available_copies, created_by, created_at) VALUES
    ('c0000000-0000-4000-8000-000000000001', '978-604-2-18901-3', 'Đắc Nhân Tâm',              'Dale Carnegie',              'NXB Tổng hợp TP.HCM',   2, 2016, 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử.', 5, 3, 'a0000000-0000-4000-8000-000000000002', '2024-01-05T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000002', '978-604-1-09234-7', 'Nhà Giả Kim',               'Paulo Coelho',               'NXB Hội Nhà Văn',        1, 2020, 'Hành trình của Santiago đến vùng đất Ai Cập tìm kho báu.', 4, 0, 'a0000000-0000-4000-8000-000000000002', '2024-01-05T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000003', '978-604-9-72311-2', 'Tư Duy Nhanh Và Chậm',      'Daniel Kahneman',            'NXB Thế Giới',           5, 2019, 'Khám phá hai hệ thống tư duy chi phối quyết định con người.', 3, 2, 'a0000000-0000-4000-8000-000000000002', '2024-01-06T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000004', '978-604-3-45612-8', 'Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari',        'NXB Tri Thức',           3, 2018, 'Hành trình tiến hóa của loài người.', 6, 4, 'a0000000-0000-4000-8000-000000000002', '2024-01-07T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000005', '978-604-7-88234-1', 'Clean Code',                'Robert C. Martin',           'NXB Khoa học kỹ thuật',   4, 2021, 'Hướng dẫn viết code sạch, dễ đọc và dễ bảo trì.', 4, 4, 'a0000000-0000-4000-8000-000000000002', '2024-01-08T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000006', '978-604-2-33219-5', 'Atomic Habits',              'James Clear',                'NXB Lao Động',           2, 2022, 'Xây dựng thói quen tốt qua những thay đổi nhỏ.', 5, 2, 'a0000000-0000-4000-8000-000000000002', '2024-01-09T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000007', '978-604-5-67890-3', 'Dune',                       'Frank Herbert',              'NXB Kim Đồng',           1, 2023, 'Sử thi khoa học viễn tưởng trên hành tinh sa mạc Arrakis.', 2, 2, 'a0000000-0000-4000-8000-000000000002', '2024-01-10T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000008', '978-604-6-11111-0', 'Homo Deus',                  'Yuval Noah Harari',          'NXB Tri Thức',           6, 2020, 'Tương lai của loài người: AI, bất tử và hạnh phúc.', 3, 1, 'a0000000-0000-4000-8000-000000000002', '2024-01-11T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000009', '978-604-8-12345-1', '1984',                       'George Orwell',              'NXB Hội Nhà Văn',        1, 2021, 'Tiểu thuyết phản địa đàng kinh điển.', 5, 3, 'a0000000-0000-4000-8000-000000000002', '2024-01-12T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000010', '978-604-8-22222-2', 'Rừng Na Uy',                'Haruki Murakami',            'NXB Hội Nhà Văn',        1, 2022, 'Câu chuyện tình yêu và trưởng thành ở Tokyo những năm 1960.', 4, 2, 'a0000000-0000-4000-8000-000000000002', '2024-01-13T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000011', '978-604-8-33333-3', 'Harry Potter và Hòn Đá Phù Thủy', 'J.K. Rowling',          'NXB Trẻ',                1, 2023, 'Cậu bé phù thủy bước vào trường Hogwarts.', 8, 5, 'a0000000-0000-4000-8000-000000000002', '2024-01-14T00:00:00Z'),
    ('c0000000-0000-4000-8000-000000000012', '978-604-8-44444-4', 'Cha Giàu Cha Nghèo',         'Robert T. Kiyosaki',         'NXB Lao Động',           8, 2020, 'Bài học tài chính từ hai người cha.', 6, 4, 'a0000000-0000-4000-8000-000000000002', '2024-01-15T00:00:00Z');

-- 6. Book Copies (mỗi sách có nhiều bản sao)
INSERT INTO book_copies (id, book_id, copy_code, condition, status) VALUES
    -- Đắc Nhân Tâm (5 bản, 3 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', '8901-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', '8901-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', '8901-003', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', '8901-004', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000001', '8901-005', 'new',  'borrowed'),
    -- Nhà Giả Kim (4 bản, 0 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000002', '9234-001', 'good', 'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000002', '9234-002', 'good', 'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000002', '9234-003', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000002', '9234-004', 'new',  'borrowed'),
    -- Tư Duy Nhanh Và Chậm (3 bản, 2 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000003', '72311-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000003', '72311-002', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000003', '72311-003', 'new',  'borrowed'),
    -- Sapiens (6 bản, 4 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-003', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-004', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-005', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000004', '45612-006', 'new',  'borrowed'),
    -- Clean Code (4 bản, 4 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000005', '88234-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000005', '88234-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000005', '88234-003', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000005', '88234-004', 'new',  'available'),
    -- Atomic Habits (5 bản, 2 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000006', '33219-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000006', '33219-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000006', '33219-003', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000006', '33219-004', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000006', '33219-005', 'new',  'borrowed'),
    -- Dune (2 bản, 2 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000007', '67890-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000007', '67890-002', 'new',  'available'),
    -- Homo Deus (3 bản, 1 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000008', '11111-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000008', '11111-002', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000008', '11111-003', 'new',  'borrowed'),
    -- 1984 (5 bản, 3 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000009', '12345-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000009', '12345-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000009', '12345-003', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000009', '12345-004', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000009', '12345-005', 'new',  'borrowed'),
    -- Rừng Na Uy (4 bản, 2 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000010', '22222-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000010', '22222-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000010', '22222-003', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000010', '22222-004', 'new',  'borrowed'),
    -- Harry Potter (8 bản, 5 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-003', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-004', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-005', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-006', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-007', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000011', '33333-008', 'new',  'borrowed'),
    -- Cha Giàu Cha Nghèo (6 bản, 4 available)
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-001', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-002', 'good', 'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-003', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-004', 'new',  'available'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-005', 'new',  'borrowed'),
    (gen_random_uuid(), 'c0000000-0000-4000-8000-000000000012', '44444-006', 'new',  'borrowed');

-- 7. Library Cards
INSERT INTO library_cards (id, user_id, issued_by, card_number, issued_date, expiry_date, status) VALUES
    ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'TV-2024-001', '2024-01-10', '2025-01-10', 'active');

-- 8. Borrow Records (mượn sách)
-- Cần biết copy_id thực tế của các bản borrowed
DO $$
DECLARE
    v_card_id    UUID := 'b0000000-0000-4000-8000-000000000001';
    v_librarian  UUID := 'a0000000-0000-4000-8000-000000000002';
    v_copy1_id   UUID;
    v_copy2_id   UUID;
    v_copy3_id   UUID;
    v_copy4_id   UUID;
BEGIN
    -- Lấy các copy bị borrowed
    SELECT id INTO v_copy1_id FROM book_copies WHERE book_id = 'c0000000-0000-4000-8000-000000000001' AND status = 'borrowed' LIMIT 1;
    SELECT id INTO v_copy2_id FROM book_copies WHERE book_id = 'c0000000-0000-4000-8000-000000000002' AND status = 'borrowed' LIMIT 1;
    SELECT id INTO v_copy3_id FROM book_copies WHERE book_id = 'c0000000-0000-4000-8000-000000000003' AND status = 'borrowed' LIMIT 1;
    SELECT id INTO v_copy4_id FROM book_copies WHERE book_id = 'c0000000-0000-4000-8000-000000000006' AND status = 'borrowed' LIMIT 1;

    -- Đang mượn (còn hạn)
    INSERT INTO borrow_records (id, library_card_id, book_copy_id, librarian_id, borrow_date, due_date, status, created_at)
    VALUES ('d0000000-0000-4000-8000-000000000001', v_card_id, v_copy1_id, v_librarian,
            CURRENT_DATE - 10, CURRENT_DATE + 4, 'borrowing', (CURRENT_DATE - 10)::TEXT || 'T09:00:00Z');

    -- Quá hạn
    INSERT INTO borrow_records (id, library_card_id, book_copy_id, librarian_id, borrow_date, due_date, status, created_at)
    VALUES ('d0000000-0000-4000-8000-000000000002', v_card_id, v_copy2_id, v_librarian,
            CURRENT_DATE - 20, CURRENT_DATE - 6, 'overdue', (CURRENT_DATE - 20)::TEXT || 'T10:00:00Z');

    -- Đã trả
    INSERT INTO borrow_records (id, library_card_id, book_copy_id, librarian_id, borrow_date, due_date, return_date, status, created_at)
    VALUES ('d0000000-0000-4000-8000-000000000003', v_card_id, v_copy3_id, v_librarian,
            CURRENT_DATE - 30, CURRENT_DATE - 16, CURRENT_DATE - 14, 'returned', (CURRENT_DATE - 30)::TEXT || 'T11:00:00Z');

    -- Các bản borrowed khác
    INSERT INTO borrow_records (library_card_id, book_copy_id, librarian_id, borrow_date, due_date, status, created_at)
    SELECT v_card_id, bc.id, v_librarian,
           CURRENT_DATE - 10, CURRENT_DATE + 7, 'borrowing', (CURRENT_DATE - 10)::TEXT || 'T09:00:00Z'
    FROM book_copies bc
    WHERE bc.status = 'borrowed'
      AND bc.id NOT IN (v_copy1_id, v_copy2_id, v_copy3_id, v_copy4_id);
END $$;

-- 9. Reservations (đặt trước sách)
INSERT INTO reservations (library_card_id, book_id, queue_position, status, reserved_at) VALUES
    ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 1, 'waiting', NOW() - INTERVAL '3 days'),
    ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 2, 'waiting', NOW() - INTERVAL '2 days'),
    ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006', 1, 'waiting', NOW() - INTERVAL '4 days'),
    ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000008', 1, 'waiting', NOW() - INTERVAL '5 days');

-- 10. Fines (tiền phạt)
INSERT INTO fines (borrow_record_id, fine_type, overdue_days, amount, status, created_at)
SELECT 'd0000000-0000-4000-8000-000000000002', 'overdue', 6, 5000 + (6 - 5) * 3000, 'pending', NOW() - INTERVAL '1 day';

-- ============================================================
-- KIỂM TRA DỮ LIỆU
-- ============================================================
-- SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';
-- \dt
