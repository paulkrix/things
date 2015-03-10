<?php

/*
if(!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == ""){
  $redirect = "https://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'];
  header("Location: $redirect");
  exit();
}
*/


session_start();
if ($_SESSION['login'] == true || $_POST['password'] == "admin") {
    $_SESSION['login'] = true;
?>
<!doctype html>

<html ng-app="things">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>Things prototype creator</title>
    
    <link href="../css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link href="../css/sb-admin-2.css" rel="stylesheet">

    <!-- Custom Fonts -->
    <link href="../font-awesome-4.1.0/css/font-awesome.min.css" rel="stylesheet" type="text/css">

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
    <script src="../js/angular-file-upload-shim.js"></script> 
    <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.12/angular.min.js"></script>
    <script src="../js/angular-file-upload.js"></script>
    <script src="../js/angular-route.min.js"></script>
    <script src="../ckeditor/ckeditor.js"></script>
    <script src="../js/bootstrap.min.js"></script>
    <script src="../js/angular-bootstrap.min.js"></script>
    <script src="../js/jquery-ui.min.js"></script>
    <script src="../js/thingManager.js"></script>
    <script src="../js/prototypeManager.js"></script>
    <script src="js/client-controller.js"></script>
    <script src="../js/sb-admin-2.js"></script>



  </head>
  <body>
    <div id="wrapper">

     <div ng-view></div>

    </div>
    <!-- /#wrapper -->
  </body>
</html>
<?php
} else {
?>
<!doctype html>

<html lang="en"><head>
  <meta charset="utf-8">
  <title>Things CMS client login</title>
  <link href="../css/bootstrap.min.css" rel="stylesheet" media="screen">
  <link href="../css/login.css" rel="stylesheet">
</head>
<body>
  <div class="jumbotron">
    <div class="container">
      <img src="">
      <h2>Client login</h2>
      <div class="box">
        <form action="index.php" method="post">
          <input name="password" type="password" placeholder="PASSWORD">
          <button type="submit" class="btn btn-default full-width"><span class="glyphicon glyphicon-ok"></span></button>
        </form>
      </div>
    </div>
  </div>
  <script src="//code.jquery.com/jquery-1.11.1.min.js"></script>
  <script src="../js/bootstrap.min.js"></script>

</body></html>

<?php
}
?>
