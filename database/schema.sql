CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  role ENUM('PATIENT','DOCTOR','PHARMACY','DELIVERY','ADMIN') NOT NULL DEFAULT 'PATIENT',
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  specialization VARCHAR(150),
  qualification VARCHAR(255),
  experience_years INT DEFAULT 0,
  registration_number VARCHAR(100),
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  bio TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  pharmacy_name VARCHAR(200) NOT NULL,
  address TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS delivery_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  vehicle_type VARCHAR(100),
  vehicle_number VARCHAR(100),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  type ENUM('ONLINE','IN_PERSON') NOT NULL DEFAULT 'ONLINE',
  status ENUM('BOOKED','WAITING','CONSULTING','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'BOOKED',
  reason TEXT,
  notes TEXT,
  token_number INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS queue_entries (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NOT NULL UNIQUE,
  token_number INT NOT NULL,
  status ENUM('WAITING','CALLED','CONSULTING','COMPLETED','SKIPPED') NOT NULL DEFAULT 'WAITING',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36),
  patient_id CHAR(36) NOT NULL,
  doctor_id CHAR(36) NOT NULL,
  diagnosis TEXT,
  advice TEXT,
  valid_until DATE,
  status ENUM('ACTIVE','CANCELLED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id CHAR(36) PRIMARY KEY,
  prescription_id CHAR(36) NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  medicine_identifier VARCHAR(100),
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  route VARCHAR(100),
  instructions TEXT,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) PRIMARY KEY,
  pharmacy_id CHAR(36) NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  medicine_identifier VARCHAR(100),
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  expiry_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacy_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) PRIMARY KEY,
  patient_id CHAR(36) NOT NULL,
  pharmacy_id CHAR(36),
  prescription_id CHAR(36),
  delivery_address TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  status ENUM('PLACED','CONFIRMED','PACKED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (pharmacy_id) REFERENCES pharmacy_profiles(id) ON DELETE SET NULL,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  inventory_item_id CHAR(36),
  medicine_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36) NOT NULL UNIQUE,
  delivery_partner_id CHAR(36),
  status ENUM('ASSIGNED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','FAILED') NOT NULL DEFAULT 'ASSIGNED',
  estimated_at DATETIME NULL,
  picked_at DATETIME NULL,
  delivered_at DATETIME NULL,
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (delivery_partner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  order_id CHAR(36),
  appointment_id CHAR(36),
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(100),
  provider_payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('CREATED','PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'CREATED',
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('PUSH','SMS','EMAIL','IN_APP') NOT NULL DEFAULT 'IN_APP',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_appointments_doctor_time ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient_time ON appointments(patient_id, scheduled_at);
CREATE INDEX idx_orders_patient ON orders(patient_id, created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_inventory_pharmacy ON inventory_items(pharmacy_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
