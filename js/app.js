import * as d3 from "https://cdn.skypack.dev/d3@7";

let now = new Date();
d3.select("#predicted-on-date").attr("value", now.toISOString().substring(0,10));

let sixMo = new Date(new Date().setDate(now.getDate() + 180));
d3.select("#predicted-by-date").attr("value", sixMo.toISOString().substring(0,10))

const config = await fetch("config.json").then(res => res.json());

d3.selectAll(".name-first").text(config.name[0]);
d3.selectAll(".name-last").text(config.name[1]);
d3.selectAll(".pronoun-nomnitive").text(config.pronouns.nomnitive);

function makeModel(data) {
  return regression.linear(
    data.map(d => ([d.PredictionLength, d.ActualLength]))
  );
}

const msToDays = 1000 * 60 * 60 * 24;

let rawTSV = await fetch(config.downloadDataURL).then(d => d.text());
let data = d3.tsvParse(rawTSV);

let subset = data
  .filter(d => d.Error !== "")
  .map(d => {
    d.PredictionLength = +d.PredictionLength;
    d.ActualLength = +d.ActualLength;
    return d;
  });

let model = makeModel(subset);

function updatePrediction(){
  let predictedOnDate = new Date(d3.select("#predicted-on-date").property("value"));
  let predictedByDate = new Date(d3.select("#predicted-by-date").property("value"));
  var result = new Date(predictedByDate);
  let prediction = model.predict(Math.floor((predictedByDate - predictedOnDate) / msToDays));
  result.setDate(result.getDate() + prediction[1]);
  d3.select("#corrected-date").attr("value", result.toISOString().substring(0,10));
}

d3.select("#predicted-on-date").on("change", updatePrediction);
d3.select("#predicted-by-date").on("change", updatePrediction);

updatePrediction();

let readme = await fetch("README.md").then(d => d.text());
d3.select("#how").html(marked.parse(readme));
d3.select("#how-button").on("click", () => d3.select("#how-modal").classed("is-active", true));
d3.selectAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button').on("click", () => {
  d3.select("#how-modal").classed("is-active", false);
});
document.addEventListener('keydown', e => {
  if(e.key === "Escape") d3.select("#how-modal").classed("is-active", false);
});

d3.select("#view-data").attr("href", config.viewDataURL);

d3.select("#download-data").on("click", () => {
  let blob = new Blob([rawTSV], {type: 'text/tsv;charset=utf-8'});
  saveAs(blob, 'MuskPredictions.tsv');
});

d3.select("#suggest").attr("href", config.suggestionURL);
