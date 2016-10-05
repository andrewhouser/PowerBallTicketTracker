SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;


CREATE TABLE `draws` (
`id` int(10) unsigned NOT NULL,
  `DrawDate` date NOT NULL,
  `WB1` smallint(6) NOT NULL,
  `WB2` smallint(6) NOT NULL,
  `WB3` smallint(6) NOT NULL,
  `WB4` smallint(6) NOT NULL,
  `WB5` smallint(6) NOT NULL,
  `PB` smallint(6) NOT NULL,
  `PP` smallint(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `jackpot` (
`id` int(10) unsigned NOT NULL,
  `jackpot` varchar(100) NOT NULL,
  `dt` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


ALTER TABLE `draws`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `draw_date` (`DrawDate`);

ALTER TABLE `jackpot`
 ADD PRIMARY KEY (`id`);


ALTER TABLE `draws`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
ALTER TABLE `jackpot`
MODIFY `id` int(10) unsigned NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
