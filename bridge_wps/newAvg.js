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
const sleepNap = Number(Context.argv.sleepNap);
const sleepMaxHR = Number(Context.argv.sleepMaxHR);
const sleepAvgHR = Number(Context.argv.sleepAvgHR);
const weight = Number(Context.argv.weight);
const xiaomi_sleepScore = Number(Context.argv.xiaomi_sleepScore);

const result = {
  "newAvg_calorie": 0,
  "newAvg_rHR": 0,
  "newAvg_avgHR": 0,
  "newAvg_sleepDuration": 0,
  "newAvg_sleepMaxHR": 0,
  "newAvg_sleepAvgHR": 0,
  "newAvg_weight": 0 ,
  "hrScore" : 0 ,
  "sleepScore" : 0 ,
  "weightScore" : 0 ,
};

result.newAvg_calorie       = 0.25 * calorie        + 0.75 * avg_calorie;
result.newAvg_rHR           = 0.25 * rHR            + 0.75 * avg_rHR;
result.newAvg_avgHR         = 0.25 * avgHR          + 0.75 * avg_avgHR;
result.newAvg_sleepDuration = 0.25 * sleepDuration  + 0.75 * avg_sleepDuration;
result.newAvg_sleepMaxHR    = 0.25 * sleepMaxHR     + 0.75 * avg_sleepMaxHR;
result.newAvg_sleepAvgHR    = 0.25 * sleepAvgHR     + 0.75 * avg_sleepAvgHR;
result.newAvg_weight        = 0.25 * weight         + 0.75 * avg_weight;


function Calculate_hrScore(rHR, avgHR, sleepAvgHR, avg_rHR, avg_avgHR, avg_sleepAvgHR, ideal_rHR = 60, ideal_avgHR = 80, ideal_sleepAvgHR = 60) {
  const target_rHR = (ideal_rHR + avg_rHR) / 2;
  const target_avgHR = (ideal_avgHR + avg_avgHR) / 2;
  const target_sleepAvgHR = (ideal_sleepAvgHR + avg_sleepAvgHR) / 2;
  const hrScore = 100 * (target_rHR / rHR + target_avgHR / avgHR + target_sleepAvgHR / sleepAvgHR) / 3;
  return hrScore ;
}
result.hrScore = Calculate_hrScore(rHR, avgHR, sleepAvgHR, result.newAvg_rHR, result.newAvg_avgHR, result.newAvg_sleepAvgHR) ;


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
result.sleepScore = Calulate_sleepScore(sleepDuration, sleepNap, xiaomi_sleepScore, result.newAvg_sleepDuration);


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
result.weightScore = Calculate_weightScore(weight, result.newAvg_weight) ;

result.resultStr = JSON.stringify(result);
console.log("result: " + result.resultStr);

return result ;