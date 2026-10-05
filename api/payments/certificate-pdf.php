<?php
declare(strict_types=1);
/* Included only after private-session authorisation and live payment verification. */
if (!function_exists('pci_certificate')) { http_response_code(404);exit; }
function pci_certificate_pdf(array $row,array $certificate): string {
    if (!pci_certificate_eligible($row)) throw new LogicException('Verified step payment required');
    $content='';
    $widths=[
        'F1'=>[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],
        'F2'=>[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,350,556,350,278,556,500,1000,556,556,333,1000,667,333,1000,350,611,350,350,278,278,500,500,350,556,1000,333,1000,556,333,944,350,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556],
        'F3'=>[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,350,500,350,333,500,444,1000,500,500,333,1000,556,333,889,350,611,350,350,333,333,444,444,350,500,1000,333,980,389,333,722,350,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500],
    ];
    $measure=static function(string $encoded,string $font,int $size) use ($widths): float {
        $width=0;for($i=0;$i<strlen($encoded);$i++) $width+=$widths[$font][ord($encoded[$i])] ?: 556;return $width*$size/1000;
    };
    $text=static function(string $value,float $x,float $y,int $size=12,string $font='F1',string $color='0.13 0.12 0.11') use (&$content): void {
        $value=iconv('UTF-8','Windows-1252//TRANSLIT//IGNORE',$value) ?: $value;
        $value=str_replace(['\\','(',')',"\r","\n"],['\\\\','\\(','\\)','',' '],$value);
        $content.="$color rg BT /$font $size Tf 1 0 0 1 $x $y Tm ($value) Tj ET\n";
    };
    $center=static function(string $value,float $y,int $size=12,string $font='F1',string $color='0.13 0.12 0.11') use ($text,$measure): void {
        /* Exact WinAnsi font widths keep the certificate centred on every viewer. */
        $encoded=iconv('UTF-8','Windows-1252//TRANSLIT//IGNORE',$value) ?: $value;
        $width=$measure($encoded,$font,$size);
        $text($value,max(70,(842-$width)/2),$y,$size,$font,$color);
    };
    $content.="0.996 0.984 0.957 rg 0 0 842 595 re f\n0.74 0.19 0.16 rg 0 578 842 17 re f\n0.69 0.53 0.30 RG 1 w 26 26 790 536 re S\n0.89 0.82 0.69 RG .5 w 34 34 774 520 re S\n";
    $content.="q 55 0 0 42 393 501 cm /Logo Do Q\n";
    $center('PAMODZI COMMUNITY INITIATIVE UGANDA',483,10,'F2');
    $center('WALK FOR EDUCATION 2026',460,11,'F2','0.58 0.40 0.20');
    $center('Certificate of Contribution',406,35,'F3');
    $center('Presented with appreciation to',365,12,'F1','0.45 0.40 0.35');
    $encodedName=iconv('UTF-8','Windows-1252//TRANSLIT//IGNORE',trim((string)$row['name'])) ?: 'Supporter';
    $chunks=explode("\n",wordwrap($encodedName,44,"\n",true));
    if(count($chunks)>3) $chunks=[...array_slice($chunks,0,2),implode(' ',array_slice($chunks,2))];
    $size=count($chunks)>1?24:32;
    foreach($chunks as $chunk) $size=min($size,max(12,(int)floor(680/max(1,$measure($chunk,'F3',1)))));
    $y=326;foreach($chunks as $chunk) { $line=iconv('Windows-1252','UTF-8',$chunk);$center($line,$y,$size,'F3','0.74 0.19 0.16');$y-=30; }
    $y=min(270,$y-10);
    $steps=number_format((int)$row['steps']);$amount='UGX '.number_format((int)$row['amount']);
    $center('For sponsoring '.$steps.((int)$row['steps']===1?' step':' steps').' through a verified contribution of '.$amount.'.',$y,13,'F2');
    $center('Supporting UCU-Kagando University College and Kagando Nursery & Primary School.',$y-26,11);
    $center('Buy a step. Build a future.',$y-64,20,'F3','0.58 0.40 0.20');
    $center('Nairobi to Kagando  |  Approximately 1,100 km  |  UGX 5,000 per sponsored step',$y-90,10,'F1','0.45 0.40 0.35');
    $content.="0.86 0.79 0.65 RG .6 w 80 118 m 762 118 l S\n";
    $text('Issued digitally by Pamodzi Community Initiative Uganda',80,98,10,'F2');
    $text('Issued: '.gmdate('d M Y',strtotime($certificate['issued_at'])),80,80,9);
    $text('Certificate: '.$certificate['code'],80,64,9);
    $text('Payment reference: '.$row['reference'],80,48,8,'F1','0.45 0.40 0.35');
    $text('VERIFY THIS CERTIFICATE',526,98,9,'F2','0.58 0.40 0.20');
    $text('pamodzici.com/contribute/verify/',526,80,9);
    $text('?code='.$certificate['code'],526,64,8);
    $text('Recognition of support; not an academic award or tax certificate.',80,13,7,'F1','0.45 0.40 0.35');
    $image=file_get_contents(dirname(__DIR__,2).'/assets/walk-for-education/certificate-logo.jpg');
    if($image===false)throw new RuntimeException('Certificate artwork unavailable');
    $info=getimagesizefromstring($image);
    $objects=[
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> /XObject << /Logo 7 0 R >> >> /Contents 8 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>',
        '<< /Type /XObject /Subtype /Image /Width '.$info[0].' /Height '.$info[1].' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '.strlen($image).' >>'."\nstream\n".$image."\nendstream",
        '<< /Length '.strlen($content).' >>'."\nstream\n".$content.'endstream',
    ];
    $pdf="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";$offsets=[0];foreach($objects as $i=>$object){$offsets[]=strlen($pdf);$pdf.=($i+1)." 0 obj\n".$object."\nendobj\n";}
    $xref=strlen($pdf);$pdf.="xref\n0 9\n0000000000 65535 f \n";foreach(array_slice($offsets,1) as $offset)$pdf.=sprintf('%010d 00000 n ',$offset)."\n";
    return $pdf."trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
}
