<?php
require_once('DataManager.php');

$payload = json_decode(file_get_contents('php://input'));
$data = $payload->data;
$type = $payload->type;

$DM = new DataManager();

if($type == "prototype") {
  $DM->savePrototype($data);
}

if($type == "thing") {
  $DM->saveThing($data);
}

$DM->respond();

?>