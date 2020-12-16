<?php

$ini = parse_ini_file("config.ini", true)["dg"];

require 'vendor/autoload.php';
require 'PlancakeEmailParser.php';

// Set the timezone
date_default_timezone_set('America/New_York');

// Hide errors
error_reporting(0);

use Aws\S3\S3Client;

$bucket = 'mail-dump';

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'profile' => $ini['AWS_PROFILE']
]);
