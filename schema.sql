-- Sprout / Serenity backend schema
-- Import with: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS sprout_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sprout_app;

-- ---------- users ----------

CREATE TABLE users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  email               VARCHAR(190) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  pet_name            VARCHAR(50)  NOT NULL DEFAULT 'Pip',
  water_goal          INT          NOT NULL DEFAULT 8,
  dark_mode           TINYINT(1)   NOT NULL DEFAULT 0,
  points              INT          NOT NULL DEFAULT 0,
  equipped_accessory  VARCHAR(20)  NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ---------- daily logs ----------

CREATE TABLE mood_entries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  entry_date  DATE NOT NULL,
  value       TINYINT NOT NULL,
  note        TEXT,
  UNIQUE KEY uniq_user_date (user_id, entry_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE water_log (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  log_date  DATE NOT NULL,
  cups      INT NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sleep_log (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  log_date  DATE NOT NULL,
  hours     DECIMAL(3,1) NOT NULL,
  quality   ENUM('Poor','Okay','Great') NOT NULL DEFAULT 'Okay',
  UNIQUE KEY uniq_user_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE workouts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  log_date    DATE NOT NULL,
  type        VARCHAR(30) NOT NULL,
  duration    INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE meals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  log_date    DATE NOT NULL,
  name        VARCHAR(120) NOT NULL,
  type        VARCHAR(20) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- habits ----------

CREATE TABLE habits (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE habit_completions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  habit_id         INT NOT NULL,
  completed_date   DATE NOT NULL,
  UNIQUE KEY uniq_habit_date (habit_id, completed_date),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- ---------- companion accessories ----------

CREATE TABLE accessories (
  id           VARCHAR(20) PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  emoji        VARCHAR(10) NOT NULL,
  unlock_type  ENUM('water','points') NOT NULL,
  cost         INT NOT NULL DEFAULT 0
);

INSERT INTO accessories (id, name, emoji, unlock_type, cost) VALUES
  ('bowl',    'Fancy Water Bowl', '🥣', 'water',  0),
  ('blanket', 'Cozy Blanket',     '🧶', 'points', 30),
  ('glasses', 'Sunglasses',       '🕶️', 'points', 45),
  ('hat',     'Little Hat',       '🎩', 'points', 40),
  ('collar',  'Star Collar',      '⭐', 'points', 50),
  ('crown',   'Flower Crown',     '🌸', 'points', 60),
  ('scarf',   'Rainbow Scarf',    '🌈', 'points', 70);

CREATE TABLE user_accessories (
  user_id        INT NOT NULL,
  accessory_id   VARCHAR(20) NOT NULL,
  unlocked_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, accessory_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accessory_id) REFERENCES accessories(id) ON DELETE CASCADE
);

-- ---------- once-per-day bonus tracking ----------
-- prevents re-saving the same day's mood/water/sleep entry from farming points repeatedly

CREATE TABLE daily_awards (
  user_id      INT NOT NULL,
  award_date   DATE NOT NULL,
  water        TINYINT(1) NOT NULL DEFAULT 0,
  mood         TINYINT(1) NOT NULL DEFAULT 0,
  sleep        TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, award_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
