<?php
declare(strict_types=1);
ini_set('display_errors','0');header('Cache-Control: no-store');header('Referrer-Policy: no-referrer');
require dirname(__DIR__).'/lib/payments.php';
try {
    pci_session();$reference=$_GET['OrderMerchantReference'] ?? ($_GET['reference'] ?? '');$tracking=$_GET['OrderTrackingId'] ?? '';
    if (!is_string($reference) || !is_string($tracking) || strlen($reference)>50 || strlen($tracking)>50) throw new InvalidArgumentException('Invalid return');
    $row=pci_find($reference);
    $ownCancellation=isset($_GET['cancelled']) && !empty($_SESSION['pci_view'][$reference]);
    if ($row && $row['tracking_id'] && (hash_equals($row['tracking_id'],$tracking) || $ownCancellation)) {
        try { $row=pci_verify($row); } catch(Throwable $e) { /* IPN or a later refresh can verify it. */ }
        if (!empty($_SESSION['pci_view'][$reference])) {
            if (isset($_GET['cancelled']) && $row['status']==='pending') {
                $q=pci_db()->prepare("UPDATE contributions SET status='cancelled',updated_at=? WHERE reference=? AND status='pending'");$q->execute([pci_now(),$reference]);pci_audit($reference,'supporter','checkout_cancelled');
            }
            header('Location: ../../contribute/payment/?reference='.rawurlencode($reference),true,303);exit;
        }
    }
} catch(Throwable $e) { /* Never disclose supporter details on a guessed return URL. */ }
header('Location: ../../contribute/payment/',true,303);
