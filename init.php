<?php

$ini = parse_ini_file("config.ini", true)["dg"];

require 'vendor/autoload.php';
require 'PlancakeEmailParser.php';

// AWS config
$AWS_KEY = $ini['AWS_KEY'];
$AWS_TOKEN = $ini['AWS_SECRET'];

// Set the timezone
date_default_timezone_set('America/New_York');

// Hide errors
error_reporting(0);

use Aws\S3\S3Client;
use Aws\S3\Exception\S3Exception;

$bucket = 'mail-dump';

$creds = array(
    'key'    => $AWS_KEY,
    'secret' => $AWS_TOKEN,
);

$s3 = new S3Client([
    'version' => 'latest',
    'region'  => 'us-east-1',
    'credentials' => $creds
]);
