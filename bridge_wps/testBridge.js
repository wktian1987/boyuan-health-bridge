// =============================================================
// 手环桥 · 昨日封档总结（get_health_history）AirScript 版
// 沿用实时快照脚本的字段结构、重试方式、sleep_nap / sleep_score / EMA 算法
//
// 与快照版差异：
// 1. 工具名 get_health_snapshot → get_health_history，按指标逐条请求
// 2. result 字段只覆盖快照里出现过的项；历史需要的指标：
//    calories / heart_rate / sleep / weight（steps/spo2/intensity/valid_stand
//    在 result 里无对应字段，暂不请求；需要时按同样封装补一条即可）
// 3. rcdType = "昨日总结"（封档行），dateStr = 被封档日 query_date
// =============================================================

// ---- 上一期 EMA 均值（同快照版入参）----
const yesterdayStr          = String(Context.argv.yesterdayStr);
const nDaysAgoDelete        = Number(Context.argv.nDaysAgoDelete);
const raw_avg_calorie       = Number(Context.argv.avg_calorie);
const raw_avg_rHR           = Number(Context.argv.avg_rHR);
const raw_avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const raw_avg_sleepMaxHR    = Number(Context.argv.avg_sleepMaxHR);
const raw_avg_sleepAvgHR    = Number(Context.argv.avg_sleepAvgHR);
const raw_avg_weight        = Number(Context.argv.avg_weight);

const url = "https://boyuan-health-bridge-5cup.onrender.com/flat-health";
const headers = {
  "Authorization": "Bearer iYnKPy#G!vQz",
  "Content-Type": "application/json",
  "Accept": "application/json"
};

const pad = n => n.toString().padStart(2, '0');

// ---- 单指标历史请求（带 20 次重试）----
// 返回 { ok, row, relative }；row = data[0]，无数据为 null
function callHistory(metric) {
  const body = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_health_history",
      "arguments": {
        "metric": metric,
        "query_date": yesterdayStr,
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
      console.log(`[${metric}] 第${waitRound + 1}次，http错误：${resp.status}`);
      sleep(5000);
      continue;
    }
    const data = resp.json();
    const row = Array.isArray(data?.data) && data.data.length ? data.data[0] : null;
    return { ok: true, row: row, relative: data?.relative || null };
  } catch (e) {
    console.log(`[${metric}] 第${waitRound + 1}次请求失败`, e.message);
    sleep(5000);
  }




// ---- 逐条拉取需要的指标 ----
const hCal  = callHistory("calories");
const hHr   = callHistory("heart_rate");
const hSleep= callHistory("sleep");
const hWt   = callHistory("weight");

// 四条都成功才算 OK；任一失败记 FAIL（字段兜底 0，不中断流程）
const coldStartResult = (hCal.ok && hHr.ok && hSleep.ok && hWt.ok) ? "OK" : "FAIL";

const calRow  = hCal.row  || {};
const hrRow   = hHr.row   || {};
const sleepRow= hSleep.row|| {};
const wtRow   = hWt.row   || {};

// ---- 时间派生（封档行）----
// updated_time 取 heart_rate 的 relative.latest_data_time；兜底 0
const updated_time = hHr.relative?.latest_data_time ?? 0;
const date = new Date(updated_time * 1000);
const latest_hour = updated_time > 0 ? date.getHours() : 0;
const timeBucket  = latest_hour + 1;

const hh = pad(date.getHours());
const mi = pad(date.getMinutes());
const ss = pad(date.getSeconds());
const timeStr = updated_time > 0 ? `${hh}:${mi}:${ss}` : "00:00:00";

const dateStr = queryDate;
const _y = new Date(updated_time * 1000 - 86400000);
const yesterdayStr = updated_time > 0
  ? `${_y.getFullYear()}-${pad(_y.getMonth() + 1)}-${pad(_y.getDate())}`
  : queryDate;

// ---- 指标映射（历史 data[0] → result 字段，缺失兜底 0）----
const calories = calRow.calories ?? 0;
const weight   = wtRow.weight ?? 0;

const max_hr            = hrRow.max_hr            ?? 0;
const min_hr            = hrRow.min_hr            ?? 0;
const avg_hr            = hrRow.avg_hr            ?? 0;
const avg_rhr           = hrRow.avg_rhr           ?? 0;
const abnormal_hr_count = hrRow.abnormal_hr_count ?? 0;

const sleep_total_duration = sleepRow.total_duration ?? 0;
const sleep_max_hr         = sleepRow.max_hr         ?? 0;
const sleep_min_hr         = sleepRow.min_hr         ?? 0;
const sleep_avg_hr         = sleepRow.avg_hr         ?? 0;

// ---- 午睡分段：沿用快照版 09:00–18:00 白天段累加 ----
let sleep_nap = 0;
const sleep_segment = sleepRow.segment_details ?? null;
if (sleep_total_duration > 0 && Array.isArray(sleep_segment)) {
  for (let i = 0; i < sleep_segment.length; i++) {
    const thisSegment = sleep_segment[i];
    const thisBedtime = new Date(thisSegment.bedtime * 1000);
    const thisBedtimeHour = thisBedtime.getHours();
    if (thisBedtimeHour > 9 && thisBedtimeHour < 18) {
      sleep_nap += thisSegment.duration;
    }
  }
}

// ---- 睡眠评分：沿用快照版自定义公式（不直接用接口 sleep_score）----
const sleep_total_target = 500;
const sleep_nap_target = 30;
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

// ---- EMA 滚动：0.25 × 本期封档值 + 0.75 × 上一期均值（同快照版）----
const newAvg_calorie       = 0.25 * calories             + 0.75 * raw_avg_calorie;
const newAvg_rHR           = 0.25 * avg_rhr            + 0.75 * raw_avg_rHR;
const newAvg_sleepDuration = 0.25 * sleep_total_duration+ 0.75 * raw_avg_sleepDuration;
const newAvg_sleepMaxHR    = 0.25 * sleep_max_hr        + 0.75 * raw_avg_sleepMaxHR;
const newAvg_sleepAvgHR    = 0.25 * sleep_avg_hr        + 0.75 * raw_avg_sleepAvgHR;
const newAvg_weight        = 0.25 * weight              + 0.75 * raw_avg_weight;

const rcdType = "昨日总结";

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
result.rawData = JSON.stringify({
  query_date: queryDate,
  calories: calRow,
  heart_rate: hrRow,
  sleep: sleepRow,
  weight: wtRow
});
console.log("result: " + result.resultStr);

return result;