<?php
date_default_timezone_set('America/New_York');

$states = array(
    'AL'=>'Alabama',
    'AK'=>'Alaska',
    'AZ'=>'Arizona',
    'AR'=>'Arkansas',
    'CA'=>'California',
    'CO'=>'Colorado',
    'CT'=>'Connecticut',
    'DE'=>'Delaware',
    'DC'=>'District of Columbia',
    'FL'=>'Florida',
    'GA'=>'Georgia',
    'HI'=>'Hawaii',
    'ID'=>'Idaho',
    'IL'=>'Illinois',
    'IN'=>'Indiana',
    'IA'=>'Iowa',
    'KS'=>'Kansas',
    'KY'=>'Kentucky',
    'LA'=>'Louisiana',
    'ME'=>'Maine',
    'MD'=>'Maryland',
    'MA'=>'Massachusetts',
    'MI'=>'Michigan',
    'MN'=>'Minnesota',
    'MS'=>'Mississippi',
    'MO'=>'Missouri',
    'MT'=>'Montana',
    'NE'=>'Nebraska',
    'NV'=>'Nevada',
    'NH'=>'New Hampshire',
    'NJ'=>'New Jersey',
    'NM'=>'New Mexico',
    'NY'=>'New York',
    'NC'=>'North Carolina',
    'ND'=>'North Dakota',
    'OH'=>'Ohio',
    'OK'=>'Oklahoma',
    'OR'=>'Oregon',
    'PA'=>'Pennsylvania',
    'PR'=>'Puerto Rico',
    'RI'=>'Rhode Island',
    'SC'=>'South Carolina',
    'SD'=>'South Dakota',
    'TN'=>'Tennessee',
    'TX'=>'Texas',
    'UT'=>'Utah',
    'VT'=>'Vermont',
    'VA'=>'Virginia',
    'WA'=>'Washington',
    'WV'=>'West Virginia',
    'WI'=>'Wisconsin',
    'WY'=>'Wyoming',
);
/*
$types = ['us', 'state', 'county'];
$week = 0;
$download_date = '20160906';
while($download_date < '20160930') {
    if($week > 0) {
        $download_date = date('Ymd', strtotime('+1 Week', strtotime($download_date)));
    }

    foreach($types as $type) {
        $filename = $type . "_" . $download_date;
        $ch = curl_init("http://droughtmonitor.unl.edu/USDMStatistics.ashx/?mode=table&aoi=$type&date=$download_date");
        $fp = fopen("raw_data/$filename.csv", "wb");

        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

        curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        echo $filename . "\n";
    }

    $week++;
} */

$headers = ['state','nothing','D0','D1','D2','D3','D4', 'year', 'month'];
$county_headers = ['fips','county','state','nothing','D0','D1','D2','D3','D4', 'year', 'month'];
/*
foreach($states as $abbrev => $state) {
    $fg = fopen("data/$abbrev.csv", "wb");
    fputcsv($fg, $headers);
    fclose($fg);

    $fx = fopen("data/$abbrev-counties.csv", "a");
    fputcsv($fx, $county_headers);
    fclose($fx);
}
*/
$files = scandir('raw_data');

$fh = fopen('data/us_all.csv', 'a');
fputcsv($fh, $headers);

foreach($files as $file) {
    if(is_dir($file) || !preg_match('/201609/', $file)) { continue; }

    if(preg_match('/^us/', $file)) {
        if (($handle = fopen("raw_data/$file", "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                $rows = splitOut($data, 7);
                if(preg_match('/total/', strtolower($rows[0]))) {
                    fputcsv($fh, $rows);
                }
            }
        }
        fclose($handle);
    }

    if(preg_match('/^state/', $file)) {
        if (($handles = fopen("raw_data/$file", "r")) !== FALSE) {
            while (($data = fgetcsv($handles, 1000, ",")) !== FALSE) {
                if(preg_match('/^\d/', $data[0])) {
                    $rows = splitOut($data, 7);
                    $fl = fopen("data/" . $rows[0] . ".csv", "a");
                    fputcsv($fl, $rows);
                    fclose($fl);
                }
            }
        }
        fclose($handles);
    }

    if(preg_match('/county/', $file)) {
        if (($pg = fopen("raw_data/$file", "r")) !== FALSE) {
            while (($data = fgetcsv($pg, 1000, ",")) !== FALSE) {
                if(preg_match('/^\d/', $data[0])) {
                    $rows = splitOut($data, 9);
                    $fk = fopen("data/" . $rows[2] . "-counties.csv", "a");
                    fputcsv($fk, $rows);
                    fclose($fk);
                }
            }
        }
        fclose($pg);
    }

    echo $file . " processed\n";
}
fclose($fh);

function splitOut($data, $slice) {
    $date_parts = preg_split('/-/', $data[0]);
    $rows = array_slice($data, 1, $slice);
    $rows[$slice] = substr($date_parts[0], -2);
    $rows[$slice + 1] = $date_parts[1];

    return $rows;
}