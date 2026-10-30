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
            $rows[]=['ledger'=>'gateway','id'=>$r['reference'],'name'=>$r['name'],'phone'=>$r['phone'],'amount'=>(int)$r['amount'],'currency'=>$r['currency'],'kind'=>$r['kind'],'date'=>substr($r['created_at'],0,10),'channel'=>$r['kind']==='pledge'?'Website pledge':($r['method'] ?: 'Pesapal'),'transaction_ref'=>$r['receipt'],'pledge_id'=>null,'country'=>$r['country'],'step_unit'=>(int)$r['step_unit'],'status'=>$r['status'],'reconciled_at'=>$r['reconciled_at'],'source'=>$r['kind']==='pledge'?'Website pledge':'Gateway ledger','source_row'=>'','created_at'=>$r['created_at'],'environment'=>$r['environment'],'included_received'=>$r['kind']==='payment' && $r['status']==='successful' && (bool)$r['reconciled_at'] && $r['environment']==='live','notes'=>'','evidence'=>''];
        }
        return ['schema'=>1,'campaign'=>'Walk for Education - UCU Kagando','exportedAt'=>pci_now(),'totals'=>ops_totals(),'rows'=>$rows,'notice'=>'Private report. Pledges are not received funds. Offline edits do not update the database. Download again after saving changes in the console.'];
    });
}

/* Public report is an explicit aggregate projection, never a redacted private register. */
function ops_public_report(): array {
    return ops_transaction(function() {
        $data=ops_public();$t=$data['totals'];
        $currencies=array_map(static fn($r)=>[
            'currency'=>$r['currency'],'received'=>(int)$r['received'],
            'pledged'=>(int)$r['pledged'],'outstanding'=>(int)$r['outstanding']
        ],$t['currencies']);
        $walk=null;
        if($data['walk']) {
            $walk=array_intersect_key($data['walk'],array_flip(['activity','physical','km','date','town','story']));
        }
        $report=['schema'=>1,'audience'=>'public','campaign'=>'Walk for Education - UCU Kagando',
            'reportingCutoff'=>$data['reportingCutoff'],'verificationLabel'=>'Finance-reconciled receipts only',
            'totals'=>['currencies'=>$currencies,'confirmedSteps'=>(int)$t['confirmedSteps'],'lastReconciledAt'=>$t['lastReconciledAt']],
            'walk'=>$walk,'approvedAt'=>$data['approvedAt'],'url'=>'https://pamodzici.com/walk-for-education/accountability/#collections'];
        $report['reportId']='WFE-UPDATE-'.strtoupper(substr(hash('sha256',json_encode($report,JSON_THROW_ON_ERROR)),0,12));
        return $report;
    });
}

/* One private view of the existing rows; pagination never creates another pledge. */
function ops_register(array $b): array {
    $query=ops_text($b['query'] ?? '',160);
    $page=$b['page'] ?? 1;$limit=$b['limit'] ?? 50;
    if(!is_int($page) || $page<1 || $page>1000000 || !is_int($limit) || $limit<1 || $limit>100) throw new InvalidArgumentException('Check register page and limit');
    $report=ops_report();$paid=[];
    foreach($report['rows'] as $r) if($r['included_received'] && !empty($r['pledge_id'])) {
        $key=$r['pledge_id'].'|'.$r['currency'];$paid[$key]=($paid[$key] ?? 0)+(int)$r['amount'];
    }
    $rows=[];
    foreach($report['rows'] as $r) {
        if($r['kind']==='pledge') {
            $r['received_amount']=$paid[$r['id'].'|'.$r['currency']] ?? 0;
            $r['outstanding_amount']=$r['status']==='pledged'?max(0,(int)$r['amount']-$r['received_amount']):0;
            $r['financial_status']=$r['status']==='pledged'
                ? ($r['received_amount']>=(int)$r['amount']?'Paid':($r['received_amount']>0?'Part-paid':'Pledged'))
                : ucfirst($r['status']);
        } else {
            $r['financial_status']=$r['environment']!=='live'?'Test record - excluded':($r['included_received']?'Verified received':(in_array($r['status'],['pending','submitted','successful'],true)?'Awaiting verification':($r['status']==='reconciled'?'Excluded from received':ucfirst($r['status']))));
        }
        $search=implode(' ',array_map(static fn($v)=>(string)$v,array_intersect_key($r,array_flip(['id','name','phone','transaction_ref','currency','status','financial_status','source']))));
        if($query==='' || stripos($search,$query)!==false) $rows[]=$r;
    }
    usort($rows,static fn($a,$b)=>strcmp($b['created_at'],$a['created_at']) ?: strcmp($b['id'],$a['id']));
    $total=count($rows);$pages=max(1,(int)ceil($total/$limit));$page=min($page,$pages);
    return ['rows'=>array_slice($rows,($page-1)*$limit,$limit),'total'=>$total,'page'=>$page,'pages'=>$pages,'limit'=>$limit,'reportingCutoff'=>$report['exportedAt']];
}
