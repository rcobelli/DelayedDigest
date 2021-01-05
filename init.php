<?php

$ini = parse_ini_file("config.ini", true)["dg"];

require 'vendor/autoload.php';
require 'PlancakeEmailParser.php';

// Set the timezone
date_default_timezone_set('America/New_York');

if ($_COOKIE['debug'] == 'true') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(-1);
} else {
    error_reporting(0);
}

use Aws\S3\S3Client;

$bucket = 'mail-dump';

putenv('HOME=/Users/ryan');

if (gethostname() == "Ryans-MBP") {
    $s3 = new S3Client([
        'version' => 'latest',
        'region'  => 'us-east-1',
        'profile' => $ini['AWS_PROFILE']
    ]);
} else {
    $s3 = new S3Client([
        'version' => 'latest',
        'region'  => 'us-east-1'
    ]);
}
