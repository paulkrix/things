<?php
ini_set('display_startup_errors',1);
ini_set('display_errors',1);
error_reporting(-1);
require_once('DataManager.php');

$DM = new DataManager();
?>
<html><body>
<?php

if($DM->truncateTables()) {

$files = glob('../uploads/*'); // get all file names
foreach($files as $file){ // iterate files
  if(is_file($file)) {
    unlink($file); // delete file
  }
}

?>
<p>All files deleted and databases truncated</p>
<?php
} else {
  echo "<p>Error truncating database tables;</p>";
}
?>
</body></html>