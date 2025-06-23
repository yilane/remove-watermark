-- IOPaint 微信小程序 MySQL 数据库设置脚本
-- 使用方法: mysql -u root -p < scripts/setup_mysql.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS iopaint_miniprogram 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建专用用户
CREATE USER IF NOT EXISTS 'iopaint'@'localhost' IDENTIFIED BY 'iopaint123';
CREATE USER IF NOT EXISTS 'iopaint'@'%' IDENTIFIED BY 'iopaint123';

-- 授予权限
GRANT ALL PRIVILEGES ON iopaint_miniprogram.* TO 'iopaint'@'localhost';
GRANT ALL PRIVILEGES ON iopaint_miniprogram.* TO 'iopaint'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 使用数据库
USE iopaint_miniprogram;

-- 显示创建结果
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'iopaint';
SHOW GRANTS FOR 'iopaint'@'localhost';

-- 连接测试
SELECT 'MySQL数据库设置完成！' AS message; 