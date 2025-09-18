-- SQL schema for loan fines tracking
-- Run this after adding isBlacklisted column if not present.

USE trustwin;

CREATE TABLE IF NOT EXISTS loan_fines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT NULL,
  customer_id INT NOT NULL,
  reason VARCHAR(255) NULL,
  fine_amount DECIMAL(12,2) NOT NULL,
  status ENUM('unpaid','paid','waived') NOT NULL DEFAULT 'unpaid',
  method ENUM('cash','bank') NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  due_reference_date DATE NULL,
  UNIQUE KEY uq_customer_open_fine (customer_id, status, due_reference_date),
  INDEX idx_customer_status (customer_id, status),
  INDEX idx_loan (loan_id),
  CONSTRAINT fk_fines_customer FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
