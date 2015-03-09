<?php
//error_reporting(E_ALL);
//ini_set('display_errors', 1);
class DataManager {

  const DB_USER = 'root';
  const DB_PASSWORD = 'root';
  const DB_HOST = 'localhost';
  const DB_NAME = 'things';  

  protected $mysqli;
  protected $response;

  function __construct() {
    $this->response = [];
    $this->response['status'] = 'success';
    $this->connect();
  }


  private function connect() {
    if($this->mysqli == null) {
      $this->mysqli = new mysqli(self::DB_HOST, self::DB_USER, self::DB_PASSWORD, self::DB_NAME);
      if($this->mysqli->connect_errno) {
        $this->response['status'] = 'error';
        $this->response['error'] = "Could not connect to database: (" . $this->mysqli->connect_errno . ") " . $this->mysqli->connect_error;
        $this->respond();
      }
    }
  }

  public function respond() {
    $this->mysqli->close();
    echo json_encode($this->response);
    exit();
  }


  public function createTables() {

    $createFieldTable = "CREATE TABLE IF NOT EXISTS `field` (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `thing` int(10) unsigned NOT NULL,
        `name` varchar(255) NOT NULL,
        `type` varchar(255) NOT NULL,
        `value` text NOT NULL,
        `array` tinyint(4) NOT NULL,
        `options` text NOT NULL,
        `helpText` text NOT NULL,
        PRIMARY KEY (`id`)
      ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0 ;";

    if ( !$this->mysqli->query( $createFieldTable ) ) {
      die($this->mysqli->error);  
    }

    $createPrototypesTable = "CREATE TABLE IF NOT EXISTS `prototypes` (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `fields` text NOT NULL,
        `options` text NOT NULL,
        PRIMARY KEY (`id`)
      ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0 ;";

    if ( !$this->mysqli->query( $createPrototypesTable ) ) {
      die($this->mysqli->error);  
    }

    $createThingTable = "CREATE TABLE IF NOT EXISTS `thing` (
        `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `name` varchar(255) NOT NULL,
        `options` text NOT NULL,
        `prototype` int(10) unsigned NOT NULL,
        PRIMARY KEY (`id`)
      ) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0 ;";

    if ( !$this->mysqli->query( $createThingTable ) ) {
      die($this->mysqli->error);  
    }

    return 1;
  }

  public function truncateTables() {

    $truncatePrototypesTable = "TRUNCATE TABLE prototypes;";
    if ( !$this->mysqli->query( $truncatePrototypesTable ) ) {
      die($this->mysqli->error);  
    }
    $truncateFieldTable = "TRUNCATE TABLE field;";
    if ( !$this->mysqli->query( $truncateFieldTable ) ) {
      die($this->mysqli->error);  
    }
    $truncateThingTable = "TRUNCATE TABLE thing;";
    if ( !$this->mysqli->query( $truncateThingTable ) ) {
      die($this->mysqli->error);  
    }

    return 1;

  }

  /*******
   *  Load functions
   *******/

  public function getPrototypes() {

    $statement = $this->mysqli->prepare("SELECT id, name, fields, options FROM prototypes");
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
    $statement->bind_result($id, $name, $fields, $options);
    $prototypes = [];
    
    while($statement->fetch()) {
      $prototype = [];
      $prototype['id'] = $id;
      $prototype['name'] = $name;
      $prototype['fields'] = json_decode($fields);
      $prototype['options'] = json_decode($options);
      $prototypes[] = $prototype;
    }
    $this->response['prototypes'] = $prototypes;
  }

/***
 * TODO: Add fields
 **/

  public function getThings() {

    $statement = $this->mysqli->prepare("SELECT id, name, exposed, prototype FROM thing");
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
    $statement->bind_result($id, $name, $exposed, $prototype);
    $things = [];
    $statement->store_result();
  
    while($statement->fetch()) {
      $thing = [];
      $thing['id'] = $id;
      $thing['name'] = $name;
      $thing['prototype'] = $prototype;
      $thing['exposed'] = ( $exposed == 0 ? false : true );
      $thing['fields'] = [];
  
  
      $fieldStatement = $this->mysqli->prepare("SELECT id, name, type, value, array, options, helpText FROM field WHERE field.thing = ?");
      $fieldStatement->bind_param("i", $id);
  
      if(!$fieldStatement->execute()) {
        $this->response['status'] = 'error';
        $this->response['error'] = "MySQL query error: (" . $fieldStatement->errno . ") " . $fieldStatement->error;
        $this->respond();
      }
      $fieldStatement->bind_result($fid, $fname, $type, $value, $array, $options, $helpText);
  
      while($fieldStatement->fetch()) {
        $field = [];
        $field['id'] = $fid;
        $field['name'] = $fname;
        $field['thing'] = $id;
        $field['type'] = $type;
        $field['value'] = json_decode( $value );
        $field['array'] = ( $array == 0 ? false : true );
        $field['options'] = json_decode( $options );
        $field['helpText'] = $helpText;
        $thing['fields'][] = $field;
      }
  
      $things[] = $thing;
    }
  
    $this->response['things'] = $things;
  }

  /**********
   * Save functions
   **********/

  public function saveThing($thing) {
    $statement = null;
  
    if($thing->id == NULL) {
      $statement = $this->mysqli->prepare("INSERT INTO thing (name, exposed, prototype) VALUES (?,?,?)");
      $statement->bind_param('sii', $thing->name, $thing->exposed, $thing->prototype);
    } else {
      $statement = $this->mysqli->prepare("UPDATE thing SET `name`=?, `exposed`=?, `prototype`=? WHERE `id`=?");
      $statement->bind_param('siii', $thing->name, $thing->exposed, $thing->prototype, $thing->id);
    }
    
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
    $insertId = $statement->insert_id;
    if($thing->id == NULL) {
      $thing->id = $insertId;
    }
  
    for($i = 0; $i < sizeof($thing->fields); $i++) {
      $field = $thing->fields[$i];
      if(!isset($field->helpText)) {
        $field->helpText = "";
      }
      $this->saveField($thing->id, $field);
    }
    $this->response['thingId'] = $insertId;
  }

  public function saveField($thingId, $field) {
    $statement = null;

    if($field->id == NULL) {
      $statement = $this->mysqli->prepare("INSERT INTO field (name, thing, type, value, array, options, helpText) VALUES (?,?,?,?,?,?,?)");
      $statement->bind_param('sississ', $field->name, $thingId, $field->type, json_encode( $field->value ), $field->array, json_encode( $field->options ), $field->helpText );
    } else {
      $statement = $this->mysqli->prepare("UPDATE field SET `name`=?, `thing`=?, `type`=?, `value`=?, `array`=?, `options`=?, `helpText`=? WHERE `id`=?");
      $statement->bind_param('sississi', $field->name, $thingId, $field->type, json_encode( $field->value ), $field->array, json_encode( $field->options ), $field->helpText, $field->id );
    }
    
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
    $insertId = $statement->insert_id;
    $this->response['fieldId'] = $insertId;
  }

  public function savePrototype($prototype) {
    $statement = null;
  
    if($prototype->id == NULL) {
      $statement = $this->mysqli->prepare("INSERT INTO prototypes (name, fields, options) VALUES (?,?,?)");
      $statement->bind_param('sss', $prototype->name, json_encode($prototype->fields), json_encode($prototype->options));
    } else {
      $statement = $this->mysqli->prepare("UPDATE prototypes SET `name`=?, `fields`=?, `options`=? WHERE `id`=?");
      $statement->bind_param('sssi', $prototype->name, json_encode($prototype->fields), json_encode($prototype->options), $prototype->id);
    }
    
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
  
    $insertId = $statement->insert_id;
    $this->response['prototypeId'] = $insertId;
  }

  /**********
   * Delete functions
   **********/

  /****
   * TODO: Deal with other fields that reference this prototype or it's fields (mirror fields and thing fields)
   ****/

  public function deleteThing($thing) {
    $statment = null;
  
    $statement = $this->mysqli->prepare("DELETE FROM thing WHERE `id`=?");
    $statement->bind_param('i', $thing->id);
  
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
  
    for($i = 0; $i < sizeof($thing->fields); $i++) {
      $this->deleteFields($thing);
    }
  }

  /****
   * TODO: Delete files that are linked
   ****/

  public function deleteFields($thing) {
    $statment = null;
  
    $statement = $this->mysqli->prepare("DELETE FROM field WHERE `thing`=?");
    $statement->bind_param('i', $thing->id);
  
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
  }

  /****
   * TODO: Deal with other fields that reference this prototype or it's fields (mirror fields and thing fields)
   ****/

  public function deletePrototype($prototype) {
    $statment = null;
  
    $statement = $this->mysqli->prepare("DELETE FROM prototypes WHERE `id`=?");
    $statement->bind_param('i', $prototype->id);
  
    if(!$statement->execute()) {
      $this->response['status'] = 'error';
      $this->response['error'] = "MySQL query error: (" . $statement->errno . ") " . $statement->error;
      $this->respond();
    }
  }

}

?>