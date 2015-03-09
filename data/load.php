<?php
require_once('DataManager.php');

/*
ini_set('display_startup_errors',1);
ini_set('display_errors',1);
error_reporting(-1);
*/

$DM = new DataManager();
$type = "all";

if(isset($_GET['type'])) {
  $type = $_GET['type'];
}

if($type == "prototype") {
  $DM->getPrototypes();
}

if($type == "all") {
  $DM->getPrototypes();
  $DM->getThings();
}

$DM->respond();


?>