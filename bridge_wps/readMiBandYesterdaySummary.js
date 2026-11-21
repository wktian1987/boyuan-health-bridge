const yesterdayStr = String(Context.argv.yesterdayStr);
const nDaysAgoDelete = Number(Context.argv.nDaysAgoDelete);
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

// const yesterdayStr = '2026-11-19';   // String(Context.argv.yesterdayStr);
// const nDaysAgoDelete = 30;   // Number(Context.argv.nDaysAgoDelete);
// const avg_calorie = 898;   // Number(Context.argv.avg_calorie); 
// const avg_rHR = 68;   // Number(Context.argv.avg_rHR);
// const avg_avgHR = 95 ; // Number(Context.argv.avg_avgHR);
// const avg_sleepDuration = 423;   // Number(Context.argv.avg_sleepDuration);
// const avg_sleepMaxHR = 97;   // Number(Context.argv.avg_sleepMaxHR);
// const avg_sleepAvgHR = 72;   // Number(Context.argv.avg_sleepAvgHR);
// const avg_weight = 78;   // Number(Context.argv.avg_weight);

const result = {
  "rcdType": "",
  "summaryTimestamp": 0,
  "nDaysAgoTimestamp": 0,
  "timeBucket": 24,
  "calorie": 0,
  "weight": 0,
  "maxHR": 0,
  "minHR": 0,
  "avgHR": 0,
  "rHR": 0,
  "abnormalHRcount": 0,
  "sleepDuration": 0,
  "sleepNap": 0,
  "sleepMaxHR": 0,
  "sleepMinHR": 0,
  "sleepAvgHR": 0,
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_avgHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_weight": 0,
  "hrScore": 0,
  "sleepScore": 0,
  "weightScore": 0,
  "xiaomi_sleepScore": 0
};

result.rcdType = "昨日总结";

function datatimeToTimestamp(datetimeStr) {
  const dt = new Date(datetimeStr + "+08:00");
  return Math.floor(dt.getTime() / 1000);
}

result.summaryTimestamp = datatimeToTimestamp(yesterdayStr + " 23:59:59");

result.nDaysAgoTimestamp = result.summaryTimestamp - nDaysAgoDelete * 24 * 60 * 60;


/**
 * 单指标历史请求
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
      timeout: 60000
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

const data_calorie = callHistory("calories", yesterdayStr);
const data_HR = callHistory("heart_rate", yesterdayStr);
const data_sleep = callHistory("sleep", yesterdayStr);
const data_weight = callHistory("weight", yesterdayStr);

result.calorie = data_calorie?.calories ?? 0;
result.weight = data_weight?.weight ?? avg_weight;
result.maxHR = data_HR?.max_hr ?? 0;
result.minHR = data_HR?.min_hr ?? 0;
result.avgHR = data_HR?.avg_hr ?? 0;
result.rHR = data_HR?.avg_rhr ?? 0; if (result.rHR < 10) { result.rHR = avg_rHR }
result.abnormalHRcount = data_HR?.abnormal_hr_count ?? 0;
result.sleepDuration = data_sleep?.total_duration ?? 0;
result.sleepMaxHR = data_sleep?.max_hr ?? 0; if (result.sleepMaxHR < 10) { result.sleepMaxHR = avg_sleepMaxHR }
result.sleepMinHR = data_sleep?.min_hr ?? 0; if (result.sleepMinHR < 10) { result.sleepMinHR = avg_sleepAvgHR }
result.sleepAvgHR = data_sleep?.avg_hr ?? 0; if (result.sleepAvgHR < 10) { result.sleepAvgHR = avg_sleepAvgHR }
result.xiaomi_sleepScore = data_sleep?.sleep_score ?? 0;


const sleep_segment = data_sleep?.segment_details ?? null;
if (result.sleepDuration > 0 && Array.isArray(sleep_segment)) {
  for (let i = 0; i < sleep_segment.length; i++) {
    const thisSegment = sleep_segment[i];
    const thisBedtime = new Date(thisSegment.bedtime * 1000);
    const thisBedtimeHour = thisBedtime.getHours();
    if (thisBedtimeHour > 9 && thisBedtimeHour < 18) {
      result.sleepNap += thisSegment.duration;
    }
  }
}


result.newAvg_calorie = 0.25 * result.calorie + 0.75 * avg_calorie;
result.newAvg_rHR = 0.25 * result.rHR + 0.75 * avg_rHR;
result.newAvg_avgHR = 0.25 * result.avgHR + 0.75 * avg_avgHR;
result.newAvg_sleepDuration = 0.25 * result.sleepDuration + 0.75 * avg_sleepDuration;
result.newAvg_sleepMaxHR = 0.25 * result.sleepMaxHR + 0.75 * avg_sleepMaxHR;
result.newAvg_sleepAvgHR = 0.25 * result.sleepAvgHR + 0.75 * avg_sleepAvgHR;
result.newAvg_weight = 0.25 * result.weight + 0.75 * avg_weight;


function Calculate_hrScore(rHR, avgHR, sleepAvgHR, avg_rHR, avg_avgHR, avg_sleepAvgHR, ideal_rHR = IDEAL_rHR, ideal_avgHR = IDEAL_avgHR, ideal_sleepAvgHR = IDEAL_sleepAvgHR) {
  const target_rHR = (ideal_rHR + avg_rHR) / 2;
  const target_avgHR = (ideal_avgHR + avg_avgHR) / 2;
  const target_sleepAvgHR = (ideal_sleepAvgHR + avg_sleepAvgHR) / 2;
  const hrScore = 100 * (target_rHR / rHR + target_avgHR / avgHR + target_sleepAvgHR / sleepAvgHR) / 3;
  return hrScore;
}
result.hrScore = Calculate_hrScore(result.rHR, result.avgHR, result.sleepAvgHR, result.newAvg_rHR, result.newAvg_avgHR, result.newAvg_sleepAvgHR);

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
result.sleepScore = Calulate_sleepScore(result.sleepDuration, result.sleepNap, result.xiaomi_sleepScore, result.newAvg_sleepDuration);


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

result.weightScore = Calculate_weightScore(result.weight, result.newAvg_weight);

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result;