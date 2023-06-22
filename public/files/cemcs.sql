-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 14, 2023 at 08:12 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cemcs`
--

-- --------------------------------------------------------

--
-- Table structure for table `interest`
--

CREATE TABLE `interest` (
  `id` bigint(255) NOT NULL,
  `vendor_id` bigint(255) NOT NULL,
  `product_id` bigint(255) NOT NULL,
  `user_id` bigint(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `vendor_id` bigint(255) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `vendor_id`, `description`) VALUES
(1, 'Financial Services', 1, 'Get premium financial services without risk'),
(2, 'Financial Services', 1, 'Get premium financial services without risk'),
(3, 'Test', 1, 'test');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` bigint(255) NOT NULL,
  `name` varchar(1000) NOT NULL,
  `email` varchar(1000) NOT NULL,
  `phone` varchar(1000) NOT NULL,
  `password` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `phone`, `password`) VALUES
(1, 'Osegbue Charles', 'charles.osegbue@chevron.com', '08103442322', '72214b5689b9bade97e8a8ada5f5679e');

-- --------------------------------------------------------

--
-- Table structure for table `vendor`
--

CREATE TABLE `vendor` (
  `id` bigint(255) NOT NULL,
  `name` varchar(500) NOT NULL,
  `password` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(500) NOT NULL,
  `dateCreated` datetime NOT NULL DEFAULT current_timestamp(),
  `email` varchar(500) NOT NULL,
  `phone` varchar(500) NOT NULL,
  `display` text DEFAULT NULL,
  `approve` tinyint(1) NOT NULL DEFAULT 0,
  `approver` varchar(500) NOT NULL,
  `approve_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `vendor`
--

INSERT INTO `vendor` (`id`, `name`, `password`, `description`, `category`, `dateCreated`, `email`, `phone`, `display`, `approve`, `approver`, `approve_date`) VALUES
(1, 'CEMCS', '3732dce851c56bd027f1e6c6852947d8', 'CHEVRON CEMCS', 'Financial Institution', '2023-03-11 12:42:05', 'l9lek325-smb@chevron.com', '08103442322', NULL, 0, '', '0000-00-00 00:00:00'),
(2, 'CEMCS PROJECTS', '72214b5689b9bade97e8a8ada5f5679e', '3rttgdfsq3wrefd', 'Real Estate', '2023-03-11 22:31:51', 'charles.osegbue@chevron.com', '08103442322', NULL, 0, '', '0000-00-00 00:00:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `interest`
--
ALTER TABLE `interest`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `vendor`
--
ALTER TABLE `vendor`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `interest`
--
ALTER TABLE `interest`
  MODIFY `id` bigint(255) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` bigint(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vendor`
--
ALTER TABLE `vendor`
  MODIFY `id` bigint(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
