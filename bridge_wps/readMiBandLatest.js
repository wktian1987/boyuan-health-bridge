const avg_calorie       = Number(Context.argv.avg_calorie)  ;
const avg_rHR           = Number(Context.argv.avg_rHR)  ;
const avg_avgHR         = Number(Context.argv.avg_avgHR)    ;
const avg_sleepDuration = Number(Context.argv.avg_sleepDuration)    ;
const avg_sleepMaxHR    = Number(Context.argv.avg_sleepMaxHR)   ;
const avg_sleepAvgHR    = Number(Context.argv.avg_sleepAvgHR)   ;
const avg_weight        = Number(Context.argv.avg_weight)   ;

const maxTry = 5;

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


let coldStartResult = "FAIL";
let snapshotData = null;

for (let waitRound = 0; waitRound < maxTry; waitRound++) {
    try {
        const resp = HTTP.fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            timeout: 60000
        });
        if (resp.status < 200 || resp.status >= 300) {
            console.log(`第${waitRound + 1}次，http错误：${resp.status}`);
            continue;
        }
        snapshotData = resp.json();
        coldStartResult = "OK";
        break;
    } catch (e) {
        console.log(`第${waitRound + 1}次请求失败`, e.message);
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
const weight = snapshotData?.latest?.weight?.weight ?? avg_weight;
const dateStr = snapshotData?.daily_summary?.date ?? "1987-01-18";

const max_hr = snapshotData?.daily_summary?.heart_rate?.max_hr ?? 0;
const min_hr = snapshotData?.daily_summary?.heart_rate?.min_hr ?? 0;
const avg_hr = snapshotData?.daily_summary?.heart_rate?.avg_hr ?? 0;
let avg_rhr = snapshotData?.daily_summary?.heart_rate?.avg_rhr ?? 0; if (avg_rhr < 10) { avg_rhr = avg_rHR }
const abnormal_hr_count = snapshotData?.daily_summary?.heart_rate?.abnormal_hr_count ?? 0;

const sleep_total_duration = snapshotData?.daily_summary?.sleep?.total_duration ?? 0;
let sleep_max_hr = snapshotData?.daily_summary?.sleep?.max_hr ?? 0; if (sleep_max_hr < 10) { sleep_max_hr = avg_sleepMaxHR }
let sleep_min_hr = snapshotData?.daily_summary?.sleep?.min_hr ?? 0; if (sleep_min_hr < 10) { sleep_min_hr = avg_sleepAvgHR }
let sleep_avg_hr = snapshotData?.daily_summary?.sleep?.avg_hr ?? 0; if (sleep_avg_hr < 10) { sleep_avg_hr = avg_sleepAvgHR }
const xiaomi_sleepScore = snapshotData?.daily_summary?.sleep?.sleep_score ?? 0;

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

const newAvg_calorie = 0.25 * calories + 0.75 * avg_calorie;
const newAvg_rHR = 0.25 * avg_rhr + 0.75 * avg_rHR;
const newAvg_avgHR = 0.25 * avg_hr + 0.75 * avg_avgHR;
const newAvg_sleepDuration = 0.25 * sleep_total_duration + 0.75 * avg_sleepDuration;
const newAvg_sleepMaxHR = 0.25 * sleep_max_hr + 0.75 * avg_sleepMaxHR;
const newAvg_sleepAvgHR = 0.25 * sleep_avg_hr + 0.75 * avg_sleepAvgHR;
const newAvg_weight = 0.25 * weight + 0.75 * avg_weight;

function Calculate_hrScore(rHR, avgHR, sleepAvgHR, avg_rHR, avg_avgHR, avg_sleepAvgHR, ideal_rHR = 60, ideal_avgHR = 80, ideal_sleepAvgHR = 60) {
  const target_rHR = (ideal_rHR + avg_rHR) / 2;
  const target_avgHR = (ideal_avgHR + avg_avgHR) / 2;
  const target_sleepAvgHR = (ideal_sleepAvgHR + avg_sleepAvgHR) / 2;
  const hrScore = 100 * (target_rHR / rHR + target_avgHR / avgHR + target_sleepAvgHR / sleepAvgHR) / 3;
  return hrScore ;
}
const hr_score = Calculate_hrScore(avg_rHR, avg_hr, sleep_avg_hr, newAvg_rHR, newAvg_avgHR, newAvg_sleepAvgHR) ;


function Calulate_sleepScore(sleepDuration, sleepNap, xiaomi_sleepScore, avg_sleepDuration, ideal_sleepDuration = 500, ideal_sleepNap = 50){
  const target_sleepDuration = (ideal_sleepDuration + avg_sleepDuration) / 2;
  const target_sleepNap = (ideal_sleepNap + 0.1 * target_sleepDuration + 0.1 * sleepDuration) / 3;
  let raw_sleepScore = null ;
  if (sleepDuration < target_sleepDuration) {
    raw_sleepScore = 100 * sleepDuration / target_sleepDuration;
  } else {
    const sleep_moreThanTarget = sleepDuration - target_sleepDuration;
    raw_sleepScore = Math.max(0, 100 - 0.5 * 100 * sleep_moreThanTarget / target_sleepDuration);
  }

  const Weight_sleepNap = (sleepNap, peakX, a = 0.0001) => {
    if (sleepNap <= peakX) {
      const k = 0.1 / (peakX * peakX);
      return -k * sleepNap * sleepNap + 2 * k * peakX * sleepNap + 0.9;
    } else {
      const t = sleepNap - peakX;
      return 0.9 + 0.1 / (1 + a * t * t);
    }
  };
  const sleepNapWeight = Weight_sleepNap(sleepNap, target_sleepNap);
  const initial_sleepScore = raw_sleepScore * sleepNapWeight;
  let fixed_xiaomi_sleepScore = xiaomi_sleepScore; if (xiaomi_sleepScore < 1) { fixed_xiaomi_sleepScore = xiaomi_sleepScore }
  const sleepScore = initial_sleepScore * 0.5 + fixed_xiaomi_sleepScore * 0.5;
  return sleepScore;
}
const sleep_score = Calulate_sleepScore(sleep_total_duration, sleep_nap, xiaomi_sleepScore, newAvg_sleepDuration);


function Calculate_weightScore(currentWeight, avgWeight, idealWeight = 70) {
    const target_weight = (idealWeight + avgWeight) / 2;
    let weightScore = 100 ;
    if (currentWeight < target_weight) {
        const delta_weight = target_weight - currentWeight;
        weightScore = 100 - 100 * 0.5 * delta_weight / 5 ;
    } else {
        const delta_weight = currentWeight - target_weight ;
        weightScore = 100 - 100 * delta_weight / 5 ;
    }
    return weightScore;
}
const weightScore = Calculate_weightScore(weight, newAvg_weight) ;

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
    hr_score,
    weightScore,
    xiaomi_sleepScore,
    newAvg_calorie,
    newAvg_rHR,
    newAvg_avgHR,
    newAvg_sleepAvgHR,
    newAvg_sleepDuration,
    newAvg_sleepMaxHR,
    newAvg_weight

};

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result;
