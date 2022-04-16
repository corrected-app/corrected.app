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

function makeScatterplot(data) {
  let margin = {top: 10, right: 30, bottom: 30, left: 30},
  height = window.innerHeight - margin.top - margin.bottom - 200,
  width = height; 

  // append the svg object to the body of the page
  let svg = d3.select("#scatterplot")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  let x = d3.scalePow()
    .exponent(0.5)
    .domain([0, 1500])
    .range([ 0, width ]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  let y = d3.scalePow()
    .exponent(0.5)
    .domain([0, 1500])
    .range([ height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  let colorWheel = d3.scaleOrdinal(d3.schemeCategory10).domain(
    data
      .map(d => d.Company)
      .filter((v, i, a) => a.indexOf(v) === i)
  );

  // Add dots
  svg.append('g')
    .selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
      .attr("cx", d => x(d.PredictionLength))
      .attr("cy", d => y(d.ActualLength))
      .attr("r", 5)
      .style("fill", d => colorWheel(d.Company));
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

makeScatterplot(subset);

let table = new Tabulator("#table", {
  height: 205,
  data: data,
  layout: "fitColumns",
  autoColumns: true
});
