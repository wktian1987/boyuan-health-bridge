const raw_avg_calorie = Number(Context.argv.avg_calorie);
const raw_avg_rHR = Number(Context.argv.avg_rHR);
const raw_avg_sleepDuration = Number(Context.argv.avg_sleepDuration);
const raw_avg_sleepMaxHR = Number(Context.argv.avg_sleepMaxHR);
const raw_avg_sleepAvgHR = Number(Context.argv.avg_sleepAvgHR);
const raw_avg_weight = Number(Context.argv.avg_weight);

const raw_calorie = Number(Context.argv.calorie);
const raw_rHR = Number(Context.argv.rHR);
const raw_sleepDuration = Number(Context.argv.sleepDuration);
const raw_sleepMaxHR = Number(Context.argv.sleepMaxHR);
const raw_sleepAvgHR = Number(Context.argv.sleepAvgHR);
const raw_weight = Number(Context.argv.weight);

const result = {
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_weight": 0
};

result.newAvg_calorie       = 0.25 * raw_calorie        + 0.75 * raw_avg_calorie;
result.newAvg_rHR           = 0.25 * raw_rHR            + 0.75 * raw_avg_rHR;
result.newAvg_sleepDuration = 0.25 * raw_sleepDuration  + 0.75 * raw_avg_sleepDuration;
result.newAvg_sleepMaxHR    = 0.25 * raw_sleepMaxHR     + 0.75 * raw_avg_sleepMaxHR;
result.newAvg_sleepAvgHR    = 0.25 * raw_sleepAvgHR     + 0.75 * raw_avg_sleepAvgHR;
result.newAvg_weight        = 0.25 * raw_weight         + 0.75 * raw_avg_weight;

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result ;