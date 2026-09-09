CREATE DATABASE IF NOT EXISTS quickdesk_helpdesk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quickdesk_helpdesk;

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_name VARCHAR(40) NOT NULL,
  title VARCHAR(80) NOT NULL,
  category ENUM('Hardware', 'Software', 'Network', 'Account', 'Other') NOT NULL,
  description VARCHAR(500) NOT NULL,
  status ENUM('Open', 'Working', 'Done') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_category (category),
  INDEX idx_tickets_created_at (created_at)
) ENGINE=InnoDB;

CREATE USER IF NOT EXISTS 'quickdesk_app'@'localhost'
  IDENTIFIED BY 'QuickDeskLocal!2026';

ALTER USER 'quickdesk_app'@'localhost'
  IDENTIFIED BY 'QuickDeskLocal!2026';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON quickdesk_helpdesk.*
  TO 'quickdesk_app'@'localhost';

FLUSH PRIVILEGES;