const raw_avg_calorie = Number(Context.argv.avg_calorie);
const raw_avg_rHR = Number(Context.argv.avg_rHR);
const raw_avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const raw_avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const raw_avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const raw_avg_weight = Number(Context.argv.avg_weight);


const maxTry = 20;

const url = "https://boyuan-health-bridge-5cup.onrender.com/flat-health";
const body = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_health_snapshot",
        "arguments": {}
    }
};
const headers = {
    "Authorization": "Bearer iYnKPy#G!vQz",
    "Content-Type": "application/json",
    "Accept": "application/json"
};

// sleep 封装，同步环境用
const sleep = (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) { }
};

let coldStartResult = "FAIL";
let snapshotData = null;

for (let waitRound = 0; waitRound < maxTry; waitRound++) {
    try {
        const resp = HTTP.fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            timeout: 10000
        });
        if (resp.status < 200 || resp.status >= 300) {
            console.log(`第${waitRound + 1}次，http错误：${resp.status}`);
            sleep(5000);
            continue;
        }
        snapshotData = resp.json();
        coldStartResult = "OK";
        break;
    } catch (e) {
        console.log(`第${waitRound + 1}次请求失败`, e.message);
        sleep(5000);
    }
}

const updated_time = snapshotData?.latest?.updated_time ?? 0;

const date = new Date(updated_time * 1000);
const latest_hour = date.getHours();
const timeBucket = latest_hour + 1;

const pad = n => n.toString().padStart(2, '0');

const h = pad(date.getHours());
const mi = pad(date.getMinutes());
const s = pad(date.getSeconds());
const timeStr = `${h}:${mi}:${s}`;

const yesterday = new Date(updated_time * 1000 - 86400000);
const _y = yesterday.getFullYear();
const _m = pad(yesterday.getMonth() + 1);
const _d = pad(yesterday.getDate());
const yesterdayStr = `${_y}-${_m}-${_d}`;

const calories = snapshotData?.latest?.calories?.calories ?? 0;
const weight = snapshotData?.latest?.weight?.weight ?? 0;
const dateStr = snapshotData?.daily_summary?.date ?? "1987-01-18";

const max_hr = snapshotData?.daily_summary?.heart_rate?.max_hr ?? 0;
const min_hr = snapshotData?.daily_summary?.heart_rate?.min_hr ?? 0;
const avg_hr = snapshotData?.daily_summary?.heart_rate?.avg_hr ?? 0;
const avg_rhr = snapshotData?.daily_summary?.heart_rate?.avg_rhr ?? 0;
const abnormal_hr_count = snapshotData?.daily_summary?.heart_rate?.abnormal_hr_count ?? 0;

const sleep_total_duration = snapshotData?.daily_summary?.sleep?.total_duration ?? 0;
const sleep_max_hr = snapshotData?.daily_summary?.sleep?.max_hr ?? 0;
const sleep_min_hr = snapshotData?.daily_summary?.sleep?.min_hr ?? 0;
const sleep_avg_hr = snapshotData?.daily_summary?.sleep?.avg_hr ?? 0;

let sleep_nap = 0;
const sleep_segment = snapshotData?.daily_summary?.sleep?.segment_details ?? null;
if (sleep_total_duration > 0 && Array.isArray(sleep_segment)) {
    for (let i = 0; i < sleep_segment.length; i++) {
        const thisSegment = sleep_segment[i];
        const thisBedtime = new Date(thisSegment.bedtime * 1000);
        const thisBedtimeHour = thisBedtime.getHours();
        if (thisBedtimeHour > 9 && thisBedtimeHour < 18) { sleep_nap += thisSegment.duration }
    }

}

const sleep_total_target = (500 + raw_avg_sleepDuration) / 2;
const sleep_nap_target = (50 + 0.1 * sleep_total_target) / 2;

let sleep_score = 100;
if (sleep_total_duration < sleep_total_target) {
    sleep_score = 100 * sleep_total_duration / sleep_total_target;
} else {
    const sleep_moreThanTarget = sleep_total_duration - sleep_total_target;
    sleep_score = Math.max(0, 100 - 100 * sleep_moreThanTarget / sleep_total_target);
}
let sleep_score_weight = 0.9;
if (sleep_nap < sleep_nap_target) {
    sleep_score_weight = 0.9 + 0.1 * sleep_nap / sleep_nap_target;
} else {
    const sleep_nap_moreThanTarget = sleep_nap - sleep_nap_target;
    sleep_score_weight = 0.9 + 0.1 * (1 - sleep_nap_moreThanTarget / sleep_nap_target);
}
sleep_score = sleep_score * sleep_score_weight;
sleep_score = 0.5 * sleep_score + 0.5 * snapshotData?.daily_summary?.sleep?.sleep_score ?? sleep_score;


const newAvg_calorie = 0.25 * calories + 0.75 * raw_avg_calorie;
const newAvg_rHR = 0.25 * avg_rhr + 0.75 * raw_avg_rHR;
const newAvg_sleepDuration = 0.25 * sleep_total_duration + 0.75 * raw_avg_sleepDuration;
const newAvg_sleepMaxHR = 0.25 * sleep_max_hr + 0.75 * raw_avg_sleepMaxHR;
const newAvg_sleepAvgHR = 0.25 * sleep_avg_hr + 0.75 * raw_avg_sleepAvgHR;
const newAvg_weight = 0.25 * weight + 0.75 * raw_avg_weight;

const rcdType = "实时快照";
const result = {
    coldStartResult,
    rcdType,
    updated_time,
    dateStr,
    timeStr,
    latest_hour,
    timeBucket,
    yesterdayStr,
    calories,
    weight,
    max_hr,
    min_hr,
    avg_hr,
    avg_rhr,
    abnormal_hr_count,
    sleep_total_duration,
    sleep_nap,
    sleep_score,
    sleep_max_hr,
    sleep_min_hr,
    sleep_avg_hr,
    newAvg_calorie,
    newAvg_rHR,
    newAvg_sleepAvgHR,
    newAvg_sleepDuration,
    newAvg_sleepMaxHR,
    newAvg_weight

};

result.resultStr = JSON.stringify(result);
result.rawData = JSON.stringify(snapshotData);
console.log("result: " + result.resultStr);

return result;
