<?php
require_once('DataManager.php');

$payload = json_decode(file_get_contents('php://input'));
$data = $payload->data;
$type = $payload->type;

$DM = new DataManager();

if($type == "prototype") {
  $DM->deletePrototype($data);
}

if($type == "thing") {
  $DM->deleteThing($data);
}

$DM->respond();

?>