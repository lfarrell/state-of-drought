<?php
date_default_timezone_set('America/New_York');

$files = scandir('data');

$i = 0;
foreach($files as $file) {
    if(is_dir($file)) continue;

    if(preg_match('/^us/', $file)) {
        if (($handle = fopen("raw_data/$file", "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                $rows = splitOut($data, 8);
                if(preg_match('/total/', strtolower($rows[0]))) {
                    fputcsv($fh, $rows);
                }
            }
        }
        fclose($handle);
    }


}