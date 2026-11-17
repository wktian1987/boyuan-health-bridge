const yesterdayStr = String(Context.argv.yesterdayStr);
const nDaysAgoDelete = Number(Context.argv.nDaysAgoDelete);
const raw_avg_calorie = Number(Context.argv.avg_calorie);
const raw_avg_rHR = Number(Context.argv.avg_rHR);
const raw_avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const raw_avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const raw_avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const raw_avg_weight = Number(Context.argv.avg_weight);

// const yesterdayStr = '2026-11-16';   // String(Context.argv.yesterdayStr);
// const nDaysAgoDelete = 30;   // Number(Context.argv.nDaysAgoDelete);
// const raw_avg_calorie = 1000;   // Number(Context.argv.avg_calorie); 
// const raw_avg_rHR = 70;   // Number(Context.argv.avg_rHR);
// const raw_avg_sleepDuration = 500;   // Number(Context.argv.avg_sleepDuration);
// const raw_avg_sleepMaxHR = 100;   // Number(Context.argv.avg_sleepMaxHR);
// const raw_avg_sleepAvgHR = 80;   // Number(Context.argv.avg_sleepAvgHR);
// const raw_avg_weight = 70;   // Number(Context.argv.avg_weight);

const result = {
  "rcdType": "",
  "summaryTimestamp": 0,
  "nDaysAgoTimestamp": 0,
  "timeBucket": 24,
  "calories": 0,
  "weight": 0,
  "max_hr": 0,
  "min_hr": 0,
  "avg_hr": 0,
  "avg_rhr": 0,
  "abnormal_hr_count": 0,
  "sleep_total_duration": 0,
  "sleep_nap": 0,
  "sleep_score": 0,
  "sleep_max_hr": 0,
  "sleep_min_hr": 0,
  "sleep_avg_hr": 0,
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_weight": 0
};

result.rcdType = "昨日总结";

const pad = n => n.toString().padStart(2, '0');

// sleep 封装，同步环境用
const sleep = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) { }
};


function datatimeToTimestamp(datetimeStr) {
  const dt = new Date(datetimeStr + "+08:00");
  return Math.floor(dt.getTime() / 1000);
}

result.summaryTimestamp = datatimeToTimestamp(yesterdayStr + " 23:59:59");

result.nDaysAgoTimestamp = result.summaryTimestamp - nDaysAgoDelete * 24 * 60 * 60;


/**
 * 单指标历史请求（带 20 次重试）
 * @param {string} metric - 指标名，如 "calories"、"heart_rate"、"sleep"、"weight"
 * @param {string} queryDate - 查询日期，格式为 "YYYY-MM-DD"
 * @returns {object|null} - 指标历史数据，或 null
 * */
function callHistory(metric, queryDate = yesterdayStr) {
  const url = "https://boyuan-health-bridge-5cup.onrender.com/flat-health";
  const headers = {
    "Authorization": "Bearer iYnKPy#G!vQz",
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  const body = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_health_history",
      "arguments": {
        "metric": metric,
        "query_date": queryDate,
        "days": 1
      }
    }
  };

  try {
    const resp = HTTP.fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      timeout: 10000
    });
    if (resp.status < 200 || resp.status >= 300) {
      console.log(`[${metric}] 获取失败 http错误：${resp.status}`);
    }
    console.log(`[${metric}] 获取成功`);
    const data = resp.json();
    return Array.isArray(data?.data) && data.data.length ? data.data[0] : null;
  } catch (e) {
    console.log(`[${metric}] 获取失败`, e.message);
  }
}

const data_calories = callHistory("calories", yesterdayStr);
sleep(1000);
const data_heart_rate = callHistory("heart_rate", yesterdayStr);
sleep(1000);
const data_sleep = callHistory("sleep", yesterdayStr);
sleep(1000);
const data_weight = callHistory("weight", yesterdayStr);
sleep(1000);

// console.log("data_calories:", data_calories);
// console.log("data_heart_rate:", data_heart_rate);
// console.log("data_sleep:", data_sleep);
// console.log("data_weight:", data_weight);

// const _data_calories = { "time": 1794787200, "calories": 1815, "goal": 0 };
// const _data_heart_rate = { "time": 1794787200, "avg_hr": 89, "avg_rhr": 71, "max_hr": 141, "min_hr": 61, "latest_hr": { "bpm": 74, "time": 1794873540 }, "abnormal_hr_count": 0, "aerobic_hr_zone_duration": 18, "anaerobic_hr_zone_duration": 0, "extreme_hr_zone_duration": 0, "fat_burning_hr_zone_duration": 132, "warm_up_hr_zone_duration": 410 };
// const _data_sleep = { "time": 1794787200, "total_duration": 475, "sleep_score": 91, "sleep_stage": 4, "sleep_deep_duration": 157, "sleep_light_duration": 172, "sleep_rem_duration": 123, "sleep_awake_duration": 12, "long_sleep_evaluation": 20, "day_sleep_evaluation": 0, "avg_hr": 71, "max_hr": 105, "min_hr": 61, "avg_spo2": 96, "segment_details": [{ "bedtime": 1794804600, "wake_up_time": 1794805980, "duration": 23, "sleep_deep_duration": 0, "sleep_light_duration": 0, "timezone": 32, "awake_count": 0, "sleep_awake_duration": 0 }, { "bedtime": 1794750300, "wake_up_time": 1794778140, "duration": 452, "sleep_deep_duration": 157, "sleep_light_duration": 172, "timezone": 32, "awake_count": 1, "sleep_awake_duration": 12 }] };
// const _data_weight = { "time": 1794779406, "weight": 78.5, "bmi": 24.8 };


result.calories = data_calories?.calories ?? 0;
result.weight = data_weight?.weight ?? raw_avg_weight;
result.max_hr = data_heart_rate?.max_hr ?? 0;
result.min_hr = data_heart_rate?.min_hr ?? 0;
result.avg_hr = data_heart_rate?.avg_hr ?? 0;
result.avg_rhr = data_heart_rate?.avg_rhr ?? 0;
result.abnormal_hr_count = data_heart_rate?.abnormal_hr_count ?? 0;
result.sleep_total_duration = data_sleep?.total_duration ?? 0;
result.sleep_max_hr = data_sleep?.max_hr ?? 0;
result.sleep_min_hr = data_sleep?.min_hr ?? 0;
result.sleep_avg_hr = data_sleep?.avg_hr ?? 0;

const sleep_segment = data_sleep?.segment_details ?? null;
if (result.sleep_total_duration > 0 && Array.isArray(sleep_segment)) {
  for (let i = 0; i < sleep_segment.length; i++) {
    const thisSegment = sleep_segment[i];
    const thisBedtime = new Date(thisSegment.bedtime * 1000);
    const thisBedtimeHour = thisBedtime.getHours();
    if (thisBedtimeHour > 9 && thisBedtimeHour < 18) {
      result.sleep_nap += thisSegment.duration;
    }
  }
}

// ---- 睡眠评分：沿用快照版自定义公式（不直接用接口 sleep_score）----
const sleep_total_target = 500;
const sleep_nap_target = 30;
let sleep_score = 100;
if (result.sleep_total_duration < sleep_total_target) {
  sleep_score = 100 * result.sleep_total_duration / sleep_total_target;
} else {
  const sleep_moreThanTarget = result.sleep_total_duration - sleep_total_target;
  sleep_score = Math.max(0, 100 - 100 * sleep_moreThanTarget / sleep_total_target);
}
let sleep_score_weight = 0.9;
if (result.sleep_nap < sleep_nap_target) {
  sleep_score_weight = 0.9 + 0.1 * result.sleep_nap / sleep_nap_target;
} else {
  const sleep_nap_moreThanTarget = result.sleep_nap - sleep_nap_target;
  sleep_score_weight = 0.9 + 0.1 * (1 - sleep_nap_moreThanTarget / sleep_nap_target);
}
result.sleep_score = sleep_score * sleep_score_weight;


result.newAvg_calorie = 0.25 * result.calories + 0.75 * raw_avg_calorie;
result.newAvg_rHR = 0.25 * result.avg_rhr + 0.75 * raw_avg_rHR;
result.newAvg_sleepDuration = 0.25 * result.sleep_total_duration + 0.75 * raw_avg_sleepDuration;
result.newAvg_sleepMaxHR = 0.25 * result.sleep_max_hr + 0.75 * raw_avg_sleepMaxHR;
result.newAvg_sleepAvgHR = 0.25 * result.sleep_avg_hr + 0.75 * raw_avg_sleepAvgHR;
result.newAvg_weight = 0.25 * result.weight + 0.75 * raw_avg_weight;

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result;