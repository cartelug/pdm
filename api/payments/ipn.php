<?php
declare(strict_types=1);
ini_set('display_errors','0');header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require dirname(__DIR__).'/lib/payments.php';
$reference='';$tracking='';
try {
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '',['GET','POST'],true)) { http_response_code(405);exit; }
    $body=$_GET;
    if (($_SERVER['REQUEST_METHOD'] ?? '')==='POST') {
        $raw=file_get_contents('php://input',false,null,0,4097);if (strlen($raw)>4096) throw new InvalidArgumentException('Invalid notification');
        $body=stripos($_SERVER['CONTENT_TYPE'] ?? '','application/json')===0?json_decode($raw,true):$_POST;
    }
    if (!is_array($body)) throw new InvalidArgumentException('Invalid notification');
    $reference=$body['OrderMerchantReference'] ?? '';$tracking=$body['OrderTrackingId'] ?? '';
    if (!is_string($reference) || !is_string($tracking) || strlen($reference)>50 || !preg_match('/^[a-f0-9-]{36}$/i',$tracking) || ($body['OrderNotificationType'] ?? '')!=='IPNCHANGE') throw new InvalidArgumentException('Invalid notification');
    $row=pci_find($reference);
    if (!$row || !$row['tracking_id'] || !hash_equals($row['tracking_id'],$tracking)) throw new InvalidArgumentException('Unknown transaction');
    pci_limit('ipn',150,60);pci_verify($row);
    echo json_encode(['orderNotificationType'=>'IPNCHANGE','orderTrackingId'=>$tracking,'orderMerchantReference'=>$reference,'status'=>200]);
} catch(InvalidArgumentException $e) { http_response_code(400);echo json_encode(['status'=>500]);
} catch(Throwable $e) { http_response_code(503);echo json_encode(['orderNotificationType'=>'IPNCHANGE','orderTrackingId'=>$tracking,'orderMerchantReference'=>$reference,'status'=>500]); }
