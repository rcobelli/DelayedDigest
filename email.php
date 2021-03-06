<?php

use Aws\S3\Exception\S3Exception;

include_once("init.php");

$key = $_GET['key'];

?>
<!doctype html>
<html lang="en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">

    <title>Study Split</title>
</head>
<body>
    <?php

    // Use the plain API (returns ONLY up to 1000 of your objects).
    try {
        $object = $s3->getObject([
            'Bucket' => $bucket,
            'Key' => $key
        ]);

        $emailParser = new PlancakeEmailParser($object['Body']);
        $subject = $emailParser->getSubject();
    } catch (S3Exception $e) {
        echo $e->getMessage() . PHP_EOL;
    } catch (Exception $e) {
        echo $e;
    }
    ?>
    <div class="container">
        <h1><?php echo $subject; ?></h1>
        <?php echo $emailParser->getHTMLBody(); ?>
    </div>

    <!-- Optional JavaScript -->
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
</body>
</html>
