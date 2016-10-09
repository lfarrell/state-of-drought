<?php
$path = "agg_data/data";
$files = scandir($path);

$fh = fopen("all_state.csv", "wb");
//$fg = fopen("all_county.csv", "a");
$headers = ['state', 'fips','year', 'month', 'nothing','D0','D1','D2','D3','D4'];
$headers_alt = ['state', 'year', 'month', 'nothing','D0','D1','D2','D3','D4'];
fputcsv($fh, $headers_alt);
//fputcsv($fg, $headers);

foreach($files as $file) {
    if(is_dir($file)) continue;

    if(preg_match('/counties/', $file)) {
      //  combine($path, $file, $fg);
    } else {
        combine($path, $file, $fh);
    }

    echo $file . " processed\n";
}

function combine($path, $file, $master) {
    if (($handle = fopen("$path/$file", "r")) !== FALSE) {
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if($data[0] != "state") {
                if(!preg_match('/counties/', $file)) {
                    fputcsv($master, [$data[0], $data[2], $data[3], $data[4], $data[5], $data[6], $data[7], $data[8],$data[9]]);
                } else {
                    fputcsv($master, $data);
                }
            }
        }
    }
}