<?php
declare(strict_types=1);

/* One consistent, complete report from the existing ledger; never a dashboard-page export. */
function ops_report(): array {
    return ops_transaction(function($db) {
        $rows=[];
        foreach($db->query('SELECT r.*,a.pledge_ref gateway_pledge_id FROM ops_records r LEFT JOIN ops_allocations a ON a.receipt_id=r.id ORDER BY r.created_at,r.id') as $r) {
            $r['ledger']='manual';$r['pledge_id']=$r['pledge_id'] ?: $r['gateway_pledge_id'];
            $r['included_received']=$r['kind']==='payment' && $r['status']==='reconciled' && $r['environment']==='live' && !ops_gateway_overlap((string)$r['transaction_ref']);
            unset($r['request_key'],$r['transaction_key'],$r['source_key'],$r['gateway_pledge_id']);
            $rows[]=$r;
        }
        foreach($db->query("SELECT * FROM contributions WHERE campaign='walk-for-education-2026' ORDER BY created_at,reference") as $r) {
            $rows[]=['ledger'=>'gateway','id'=>$r['reference'],'name'=>$r['name'],'amount'=>(int)$r['amount'],'currency'=>$r['currency'],'kind'=>$r['kind'],'date'=>substr($r['created_at'],0,10),'channel'=>$r['method'] ?: 'Pesapal','transaction_ref'=>$r['receipt'],'pledge_id'=>null,'country'=>$r['country'],'step_unit'=>(int)$r['step_unit'],'status'=>$r['status'],'reconciled_at'=>$r['reconciled_at'],'source'=>'Gateway ledger','source_row'=>'','created_at'=>$r['created_at'],'environment'=>$r['environment'],'included_received'=>$r['kind']==='payment' && $r['status']==='successful' && (bool)$r['reconciled_at'] && $r['environment']==='live','notes'=>'','evidence'=>''];
        }
        return ['schema'=>1,'campaign'=>'Walk for Education - UCU Kagando','exportedAt'=>pci_now(),'totals'=>ops_totals(),'rows'=>$rows,'notice'=>'Private report. Pledges are not received funds. Offline edits do not update the database. Download again after saving changes in the console.'];
    });
}
