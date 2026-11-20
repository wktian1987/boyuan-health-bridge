const avg_calorie = Number(Context.argv.avg_calorie);
const avg_rHR = Number(Context.argv.avg_rHR);
const avg_avgHR = Number(Context.argv.avg_avgHR);
const avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const avg_weight = Number(Context.argv.avg_weight);

const calorie = Number(Context.argv.calorie);
const rHR = Number(Context.argv.rHR);
const avgHR = Number(Context.argv.avgHR);
const sleepDuration = Number(Context.argv.sleepDuration);
const sleepMaxHR = Number(Context.argv.sleepMaxHR);
const sleepAvgHR = Number(Context.argv.sleepAvgHR);
const weight = Number(Context.argv.weight);

const result = {
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_avgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_weight": 0
};

result.newAvg_calorie       = 0.25 * calorie        + 0.75 * avg_calorie;
result.newAvg_rHR           = 0.25 * rHR            + 0.75 * avg_rHR;
result.newAvg_avgHR         = 0.25 * avgHR          + 0.75 * avg_avgHR;
result.newAvg_sleepDuration = 0.25 * sleepDuration  + 0.75 * avg_sleepDuration;
result.newAvg_sleepMaxHR    = 0.25 * sleepMaxHR     + 0.75 * avg_sleepMaxHR;
result.newAvg_sleepAvgHR    = 0.25 * sleepAvgHR     + 0.75 * avg_sleepAvgHR;
result.newAvg_weight        = 0.25 * weight         + 0.75 * avg_weight;

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result ;