<?php 

// Instructions:
// - Fill out the variables below.
// - Choose a random string for the passcode, use only standard (english) letters and numbers, min length 10 chars
// - Upload the script to your webspace
// - enter the URL into SLYA, e.g.: https://yourdomain.com/slya-email-interface.php?code=xxx
// - replace xxx with your chosen passcode
// - if you want to test if your interface is working correctly, download slya-email-interface-test.html, replace "interfaceURL" with your own URL and start the script in your browser. Open the console. You should either see an error message or "The email was sent".

// Config:
$passcode = '';
$to = '';
$from = '';
$maxMailsPerHour = 10; // what is the max amount of mails per hours?

// =================================================

header('Access-Control-Allow-Origin: *', true);
header('Access-Control-Allow-Methods: *', true);
header('Access-Control-Allow-Headers: Content-Type', true);

if($_SERVER['REQUEST_METHOD']=='OPTIONS') die('{}');

if(strlen($passcode) < 8) die('{ "success": false, "text": "Passcode not set or too short." }');
if(!strlen($to)) die('{ "success": false, "text": "Recipient missing." }');
if(!isset($_GET['code']) or $_GET['code']!==$passcode) die('{ "success": false, "text": "Access denied." }');

$mailCountFile = basename($_SERVER['SCRIPT_NAME'], '.php') . '.dat';
if(file_exists($mailCountFile))
{
	$filemtime = filemtime($mailCountFile);
	if(date('Y-m-d H',$filemtime) != date('Y-m-d H'))
		$curMailCount = 1;
	else
		$curMailCount = intval(file_get_contents($mailCountFile)) + 1;
}
else
{
	$filemtime = 0;
	$curMailCount = 1;
}
file_put_contents($mailCountFile, $curMailCount);

if($curMailCount > $maxMailsPerHour) die('{ "success": false, "text": "Max emails per hour exceeded!" }');

$rawpostdata = trim(file_get_contents("php://input"));
$postdata = json_decode($rawpostdata, true);

if(is_array($postdata['text']))
	$text = implode("\n",$postdata['text']);
else
	$text = $postdata['text'];

$success = mail($to, $postdata['subject'], $text, (strlen($from) ? 'From: '.$from. "\n" : '') . "Content-Type: text/plain; charset=UTF-8\nContent-Transfer-Encoding: 8bit\n" );

if($success)
	die('{ "success": true, "text": "email accepted/sent" }');
else
	die('{ "success": false, "text": "email couldn\'t be sent" }');

?>
