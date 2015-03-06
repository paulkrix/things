<?php

$payload = json_decode(file_get_contents('php://input'));
$path = $payload->path;
$filename = "../" . $path;

if (file_exists($filename)) {
  unlink($filename);
}
$response = array(
  'status' => 'success'
);
echo json_encode($response);
exit();

?>