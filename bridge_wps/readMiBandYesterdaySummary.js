const yesterdayStr = String(Context.argv.yesterdayStr);
const nDaysAgoDelete = Number(Context.argv.nDaysAgoDelete);
const raw_avg_calorie = Number(Context.argv.avg_calorie);
const raw_avg_rHR = Number(Context.argv.avg_rHR);
const raw_avg_avgHR = Number(Context.argv.avg_avgHR);
const raw_avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const raw_avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const raw_avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const raw_avg_weight = Number(Context.argv.avg_weight);

// const yesterdayStr = '2026-11-19';   // String(Context.argv.yesterdayStr);
// const nDaysAgoDelete = 30;   // Number(Context.argv.nDaysAgoDelete);
// const raw_avg_calorie = 898;   // Number(Context.argv.avg_calorie); 
// const raw_avg_rHR = 68;   // Number(Context.argv.avg_rHR);
// const raw_avg_avgHR = 95 ; // Number(Context.argv.avg_avgHR);
// const raw_avg_sleepDuration = 423;   // Number(Context.argv.avg_sleepDuration);
// const raw_avg_sleepMaxHR = 97;   // Number(Context.argv.avg_sleepMaxHR);
// const raw_avg_sleepAvgHR = 72;   // Number(Context.argv.avg_sleepAvgHR);
// const raw_avg_weight = 78;   // Number(Context.argv.avg_weight);

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
  "hr_score": 0,
  "weightScore": 0,
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_avgHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_weight": 0
};

result.rcdType = "昨日总结";

// sleep 封装，同步环境用
const sleep = (ms) => {
  const start = Date.now();
  console.log(`等待${ms}毫秒 ... ...`);
  while (Date.now() - start < ms) { }
};


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

const data_calories = callHistory("calories", yesterdayStr);
const data_heart_rate = callHistory("heart_rate", yesterdayStr);
const data_sleep = callHistory("sleep", yesterdayStr);
const data_weight = callHistory("weight", yesterdayStr);

result.calories = data_calories?.calories ?? 0;
result.weight = data_weight?.weight ?? raw_avg_weight;
result.max_hr = data_heart_rate?.max_hr ?? 0;
result.min_hr = data_heart_rate?.min_hr ?? 0;
result.avg_hr = data_heart_rate?.avg_hr ?? 0;
result.avg_rhr = data_heart_rate?.avg_rhr ?? 0; if (result.avg_rhr < 10) { result.avg_rhr = raw_avg_rHR }
result.abnormal_hr_count = data_heart_rate?.abnormal_hr_count ?? 0;
result.sleep_total_duration = data_sleep?.total_duration ?? 0;
result.sleep_max_hr = data_sleep?.max_hr ?? 0; if(result.sleep_max_hr < 10) {result.sleep_max_hr = raw_avg_sleepMaxHR}
result.sleep_min_hr = data_sleep?.min_hr ?? 0; if(result.sleep_min_hr < 10) {result.sleep_min_hr = raw_avg_sleepAvgHR}
result.sleep_avg_hr = data_sleep?.avg_hr ?? 0; if(result.sleep_avg_hr < 10) {result.sleep_avg_hr = raw_avg_sleepAvgHR}
result.xiaomi_sleepScore = data_sleep?.sleep_score ?? 0 ; 


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


result.newAvg_calorie = 0.25 * result.calories + 0.75 * raw_avg_calorie;
result.newAvg_rHR = 0.25 * result.avg_rhr + 0.75 * raw_avg_rHR;
result.newAvg_avgHR = 0.25 * result.avg_hr + 0.75 * raw_avg_avgHR;
result.newAvg_sleepDuration = 0.25 * result.sleep_total_duration + 0.75 * raw_avg_sleepDuration;
result.newAvg_sleepMaxHR = 0.25 * result.sleep_max_hr + 0.75 * raw_avg_sleepMaxHR;
result.newAvg_sleepAvgHR = 0.25 * result.sleep_avg_hr + 0.75 * raw_avg_sleepAvgHR;
result.newAvg_weight = 0.25 * result.weight + 0.75 * raw_avg_weight;


function Calculate_hrScore(rHR, avgHR, sleepAvgHR, avg_rHR, avg_avgHR, avg_sleepAvgHR, ideal_rHR = 60, ideal_avgHR = 80, ideal_sleepAvgHR = 60) {
  const target_rHR = (ideal_rHR + avg_rHR) / 2;
  const target_avgHR = (ideal_avgHR + avg_avgHR) / 2;
  const target_sleepAvgHR = (ideal_sleepAvgHR + avg_sleepAvgHR) / 2;
  const hrScore = 100 * (target_rHR / rHR + target_avgHR / avgHR + target_sleepAvgHR / sleepAvgHR) / 3;
  return hrScore ;
}
result.hr_score = Calculate_hrScore(result.avg_rhr, result.avg_hr, result.sleep_avg_hr, result.newAvg_rHR, result.newAvg_avgHR, result.newAvg_sleepAvgHR) ;


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
result.sleep_score = Calulate_sleepScore(result.sleep_total_duration, result.sleep_nap, result.xiaomi_sleepScore, result.newAvg_sleepDuration);


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

result.weightScore = Calculate_weightScore(result.weight, result.newAvg_weight) ;

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result;