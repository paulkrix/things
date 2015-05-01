<?php
  if(!isset($_POST['id']) || !isset($_POST['thing'])) {
    exit();
  }

  // Handle error code
  $error = $_FILES[$fieldName]['error'];
  switch ($error)
  {
  case UPLOAD_ERR_OK: // zero
      break;  // No error, continue process
  case UPLOAD_ERR_INI_SIZE: // 1
  case UPLOAD_ERR_FORM_SIZE: // 2
      die('File too big!'); // The Web page should indicate upfront the maximum size...
  case UPLOAD_ERR_PARTIAL: // 3
      die('Incomplete upload, please retry.');
  case UPLOAD_ERR_NO_FILE: // 4
      die('No file! Give a file in the upload field...');
  case UPLOAD_ERR_TMP_DIR: // 6 - No temp folder! :(
  case UPLOAD_ERR_CANT_WRITE: // 7 - Can't write! chmod error?
      die('Bad server config! Sorry...');
  case UPLOAD_ERR_EXTENSION: // 8 - File upload stopped by extension
      die('Bad file extension.');
  default:    // Future version of PHP?
      die("Error when uploading: $error");
  }

  $fieldId = $_POST['id'];
  $thingId = $_POST['thing'];
  $allowedExtensions = array('png', 'gif', 'jpg', 'jpeg', 'tiff');

  $tempLocation = $_FILES['file']['tmp_name'];
  $fileSize = filesize($tempLocation);
  if ($fileSize == 0) // Might test a minimum size (smallest header size for graphics...)
  {
    echo('File is empty!');
    die('File format not allowed.');
  }

  $file = $_FILES['file']['name'];
  $file = preg_replace('!.*?([^\\/]+)$!', '$1', $file);
  $file = preg_replace('/[^a-zA-Z0-9.-]+/', '_', $file);
  if (preg_match('/^(.+)\.([^.]+)$/', $file, $m) == 0) {
    // No match => No dot or nothing before the dot
    $extension = '';
  } else {
    $file = $m[1];
    $extension = $m[2];
  }
  if ($extension != '' && !in_array($extension, $allowedExtensions))
  {
    echo('File format not allowed.');
    die('File format not allowed.');
  }

  $uploaddir = "uploads/";
  $uploadfile = $uploaddir . $fieldId . '.' . $thingId . '.' . basename($_FILES['file']['name']);

//echo '<pre>';
if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadfile)) {
  echo $uploadfile;
} else {

}