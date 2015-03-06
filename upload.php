<?php

  $fieldId = $_POST['id'];
  $thingId = $_POST['thing'];

  $uploaddir = "uploads/";
  $uploadfile = $uploaddir . $fieldId . '.' . $thingId . '.' . basename($_FILES['file']['name']);

//echo '<pre>';
if (move_uploaded_file($_FILES['file']['tmp_name'], $uploadfile)) {
  echo $uploadfile;
} else {

}