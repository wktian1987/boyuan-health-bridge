const avg_calorie = Number(Context.argv.avg_calorie);
const avg_rHR = Number(Context.argv.avg_rHR);
const avg_avgHR = Number(Context.argv.avg_avgHR);
const avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const avg_weight = Number(Context.argv.avg_weight);

const IDEAL_weight = Number(Context.argv.ideal_weight);
const IDEAL_sleepDuration = Number(Context.argv.ideal_sleepDuration);
const IDEAL_sleepNap = Number(Context.argv.ideal_sleepNap);
const IDEAL_rHR = Number(Context.argv.ideal_rHR);
const IDEAL_avgHR = Number(Context.argv.ideal_avgHR);
const IDEAL_sleepAvgHR = Number(Context.argv.ideal_sleepAvgHR);

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

const updatedTime = snapshotData?.latest?.updated_time ?? 0;

const date = new Date(updatedTime * 1000);
const latestHour = date.getHours();
const timeBucket = latestHour + 1;

const pad = n => n.toString().padStart(2, '0');

const h = pad(date.getHours());
const mi = pad(date.getMinutes());
const s = pad(date.getSeconds());
const timeStr = `${h}:${mi}:${s}`;

const yesterday = new Date(updatedTime * 1000 - 86400000);
const _y = yesterday.getFullYear();
const _m = pad(yesterday.getMonth() + 1);
const _d = pad(yesterday.getDate());
const yesterdayStr = `${_y}-${_m}-${_d}`;

function datatimeToTimestamp(datetimeStr) {
  const dt = new Date(datetimeStr + "+08:00");
  return Math.floor(dt.getTime() / 1000);
}
const yesterdayEndTimestamp = datatimeToTimestamp(yesterdayStr + " 23:59:59");

let calorie = snapshotData?.latest?.calories?.calories ?? 0; if (latestHour < 1) { calorie = 0 }
const weight = snapshotData?.latest?.weight?.weight ?? avg_weight;
const dateStr = snapshotData?.daily_summary?.date ?? "1987-01-18";

const maxHR = snapshotData?.daily_summary?.heart_rate?.max_hr ?? 0;
const minHR = snapshotData?.daily_summary?.heart_rate?.min_hr ?? 0;
const avgHR = snapshotData?.daily_summary?.heart_rate?.avg_hr ?? 0;
let rHR = snapshotData?.daily_summary?.heart_rate?.avg_rhr ?? 0; if (rHR < 10) { rHR = avg_rHR }
const abnormalHRcount = snapshotData?.daily_summary?.heart_rate?.abnormal_hr_count ?? 0;

const sleepDuration = snapshotData?.daily_summary?.sleep?.total_duration ?? 0;
let sleepMaxHR = snapshotData?.daily_summary?.sleep?.max_hr ?? 0; if (sleepMaxHR < 10) { sleepMaxHR = avg_sleepMaxHR }
let sleepMinHR = snapshotData?.daily_summary?.sleep?.min_hr ?? 0; if (sleepMinHR < 10) { sleepMinHR = avg_sleepAvgHR }
let sleepAvgHR = snapshotData?.daily_summary?.sleep?.avg_hr ?? 0; if (sleepAvgHR < 10) { sleepAvgHR = avg_sleepAvgHR }
const xiaomi_sleepScore = snapshotData?.daily_summary?.sleep?.sleep_score ?? 0;

let sleepNap = 0;
const sleep_segment = snapshotData?.daily_summary?.sleep?.segment_details ?? null;
if (sleepDuration > 0 && Array.isArray(sleep_segment)) {
    for (let i = 0; i < sleep_segment.length; i++) {
        const thisSegment = sleep_segment[i];
        const thisBedtime = new Date(thisSegment.bedtime * 1000);
        const thisBedtimeHour = thisBedtime.getHours();
        if (thisBedtimeHour > 9 && thisBedtimeHour < 18) { sleepNap += thisSegment.duration }
    }

}

const newAvg_calorie = 0.25 * calorie + 0.75 * avg_calorie;
const newAvg_rHR = 0.25 * rHR + 0.75 * avg_rHR;
const newAvg_avgHR = 0.25 * avgHR + 0.75 * avg_avgHR;
const newAvg_sleepDuration = 0.25 * sleepDuration + 0.75 * avg_sleepDuration;
const newAvg_sleepMaxHR = 0.25 * sleepMaxHR + 0.75 * avg_sleepMaxHR;
const newAvg_sleepAvgHR = 0.25 * sleepAvgHR + 0.75 * avg_sleepAvgHR;
const newAvg_weight = 0.25 * weight + 0.75 * avg_weight;

function Calculate_hrScore(rHR, avgHR, sleepAvgHR, avg_rHR, avg_avgHR, avg_sleepAvgHR, ideal_rHR = IDEAL_rHR, ideal_avgHR = IDEAL_avgHR, ideal_sleepAvgHR = IDEAL_sleepAvgHR) {
    const target_rHR = (ideal_rHR + avg_rHR) / 2;
    const target_avgHR = (ideal_avgHR + avg_avgHR) / 2;
    const target_sleepAvgHR = (ideal_sleepAvgHR + avg_sleepAvgHR) / 2;
    const hrScore = 100 * (target_rHR / rHR + target_avgHR / avgHR + target_sleepAvgHR / sleepAvgHR) / 3;
    return hrScore;
}
const hrScore = Calculate_hrScore(rHR, avgHR, sleepAvgHR, newAvg_rHR, newAvg_avgHR, newAvg_sleepAvgHR);


function Calulate_sleepScore(sleepDuration, sleepNap, xiaomi_sleepScore, avg_sleepDuration, ideal_sleepDuration = IDEAL_sleepDuration, ideal_sleepNap = IDEAL_sleepNap) {
    const target_sleepDuration = (ideal_sleepDuration + avg_sleepDuration) / 2;
    const target_sleepNap = (ideal_sleepNap + 0.1 * target_sleepDuration + 0.1 * sleepDuration) / 3;
    let raw_sleepScore = null;
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
const sleepScore = Calulate_sleepScore(sleepDuration, sleepNap, xiaomi_sleepScore, newAvg_sleepDuration);


function Calculate_weightScore(currentWeight, avgWeight, idealWeight = IDEAL_weight) {
    const target_weight = (idealWeight + avgWeight) / 2;
    let weightScore = 100;
    if (currentWeight < target_weight) {
        const delta_weight = target_weight - currentWeight;
        weightScore = 100 - 100 * 0.5 * delta_weight / 5;
    } else {
        const delta_weight = currentWeight - target_weight;
        weightScore = 100 - 100 * delta_weight / 5;
    }
    return weightScore;
}
const weightScore = Calculate_weightScore(weight, newAvg_weight);

const rcdType = "实时快照";
const result = {
    coldStartResult,
    rcdType,
    updatedTime,
    dateStr,
    timeStr,
    latestHour,
    timeBucket,
    yesterdayStr,
    yesterdayEndTimestamp,
    calorie,
    weight,
    maxHR,
    minHR,
    avgHR,
    rHR,
    abnormalHRcount,
    sleepDuration,
    sleepNap,
    sleepMaxHR,
    sleepMinHR,
    sleepAvgHR,
    newAvg_calorie,
    newAvg_rHR,
    newAvg_avgHR,
    newAvg_sleepAvgHR,
    newAvg_sleepDuration,
    newAvg_sleepMaxHR,
    newAvg_weight,
    hrScore,
    sleepScore,
    weightScore,
    xiaomi_sleepScore
};

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result;
