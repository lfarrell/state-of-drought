<?php
$fh = fopen("state_centers_decimal.csv", "wb");
if (($handle = fopen("state_centers.csv", "r")) !== FALSE) {
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        if($data[0] == "state") continue;
            $lat = convertToDecimal($data[1]);
            $lng = convertToDecimal($data[2]);

            fputcsv($fh, [$data[0], $lat, "-" . $lng]);
    }
}
fclose($fh);

function convertToDecimal($field) {
    $value = preg_split('/\./', $field);
    $values = str_split($value[1], 2);
    $degrees = preg_split('/\./', $values[0] / 60)[1];
    $minutes = preg_split('/\./', $values[1] / 3600)[1];

    return $value[0] . "." . $degrees . "" . $minutes;
}