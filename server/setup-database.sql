-- 创建数据库
CREATE DATABASE IF NOT EXISTS eduplatform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用创建的数据库
USE eduplatform;

-- 创建基本表结构（仅作参考，实际会由Hibernate自动创建）
-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `real_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO `users` (`id`, `username`, `password`, `email`, `role`, `real_name`) VALUES 
(UUID(), 'admin', '$2a$10$Uj8.2W.rwK5N5b3SMZl.eeRGY9aO9tTgRWlZe5UjXvH1Ev8GHnpz6', 'admin@example.com', 'ADMIN', '系统管理员'),
-- 创建默认教师用户 (密码: teacher123)
(UUID(), 'teacher', '$2a$10$PiY6n/i9whbwj11FLAw0xOX9aUEVOWIcbtUVCxxL/KsEf8NWRaYlq', 'teacher@example.com', 'TEACHER', '张教师'),
-- 创建默认学生用户 (密码: student123)
(UUID(), 'student', '$2a$10$aA/nzQSkBTy1R4q.pq.nLOeM/crfmZQiPwD7.NQXasCb5yHMm5UWe', 'student@example.com', 'STUDENT', '李同学');

-- 显示创建结果
SELECT * FROM users;

-- 可选: 清空表结构命令 (谨慎使用)
-- DROP DATABASE IF EXISTS eduplatform; 