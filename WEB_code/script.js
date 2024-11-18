// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD68x_-wiPWQwt1B6qxvmxpvj_bW1B66yo",
  authDomain: "semesterproject-d2098.firebaseapp.com",
  databaseURL: "https://semesterproject-d2098-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "semesterproject-d2098",
  storageBucket: "semesterproject-d2098.firebaseapp.com",
  messagingSenderId: "1028173799823",
  appId: "1:1028173799823:web:ecd3d31365f12c4aa42bfa",
  measurementId: "G-0HQX1MNFLX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Reference the GSR data
const gsrValRef = ref(database, 'GSR-data/GSR_Value');
const gsrPrevRef = ref(database, 'GSR-data/GSR_Previous_Value');
const focusScoreRef = ref(database, 'GSR-data/focus_Score');
const stressPerRef = ref(database, 'GSR-data/Stress_Percentage');

// Chart dimensions
const width = 600;
const height = 450;
const margin = { top: 20, right: 30, bottom: 30, left: 50 };

// Helper function to create an SVG and return essential elements
function createChart(containerId, yDomain) {
  const svg = d3.select(containerId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().range([0, width]); // X scale for seconds
  const yScale = d3.scaleLinear().range([height, 0]).domain(yDomain); // Fixed Y range

  const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
  const yAxis = svg.append("g");

  const line = d3.line()
    .x(d => xScale(d.time))
    .y(d => yScale(d.value));

  const path = svg.append("path")
    .datum([]) // Initialize with empty data
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
    
  return { svg, xScale, yScale, xAxis, yAxis, line, path };
}

// Create the two charts
const gsrChart = createChart("#chart1", [0, 1500]);
const diffChart = createChart("#chart2", [-150, 150]);
const focusChart = createChart("#chart3", [0, 100]);

// Data storage and time counter
let gsrData = [];
let diffData = [];
let stressData = [];

let timeCounter = 0;

// Listen for real-time Firebase updates
let gsrValue = 0;
let gsrPrev = 0;
let focusScore = 0;
let stress = 0;
let stressPer =0;
let distractionCount =0;

onValue(gsrValRef, (snapshot) => {
  gsrValue = snapshot.val();
});

onValue(gsrPrevRef, (snapshot) => {
  gsrPrev = snapshot.val();
});

onValue(focusScoreRef, (snapshot) => {
  focusScore = snapshot.val();
});
onValue(stressPerRef, (snapshot) => {
  stress = snapshot.val();
  console.log
  stressPer = Math.ceil(stress);
  
});

stressPer= Math.ceil(stress);
console.log(stressPer);

// Function to update the GSR chart
function updateGsrChart() {
  timeCounter += 1;

  // Add new data point
  gsrData.push({ time: timeCounter, value: gsrValue });

  // Keep only the latest 20 points
  if (gsrData.length > 400) {
    gsrData.shift();
  }

  // Update scales and axes
  gsrChart.xScale.domain([0, timeCounter]);
  gsrChart.yScale.domain([0, 2200]);


  gsrChart.xAxis.call(d3.axisBottom(gsrChart.xScale).ticks(20).tickFormat(d => `${d}s`));
  gsrChart.yAxis.call(d3.axisLeft(gsrChart.yScale).ticks(5));

  // Update the line
  gsrChart.path.datum(gsrData).attr("d", gsrChart.line);
}

// Function to update the difference chart
function updateDiffChart() {
  const diffValue = gsrValue - gsrPrev;

  // Add new data point
  diffData.push({ time: timeCounter, value: diffValue });

  if (diffData.length > 400) {
    diffData.shift();
  }

  // Update scales and axes
  diffChart.xScale.domain([0, timeCounter]);
  diffChart.yScale.domain([-200, 200]);

  diffChart.xAxis.call(d3.axisBottom(diffChart.xScale).ticks(20).tickFormat(d => `${d}s`));
  diffChart.yAxis.call(d3.axisLeft(diffChart.yScale).ticks(15));

  // Update the line
  diffChart.path.datum(diffData).attr("d", diffChart.line);
}

function countDistraction(gsrValue, gsrPrev) {
  if ((gsrValue - gsrPrev) > 69) {
    distractionCount++;
    console.log("Distraction detected. Total count:", distractionCount);
  }
  else if((gsrValue-gsrPrev< -69)){
    distractionCount++;
    console.log("Distraction detected. Total count:", distractionCount);
  }
}

function updateStressChart() {
  // Add new data point
  stressData.push({ time: timeCounter, value: stressPer });

  // Keep only the latest 300 points
  if (stressData.length > 500) {
    stressData.shift();
  }

  // Update scales and axes
  focusChart.xScale.domain([0, timeCounter]);
  focusChart.yScale.domain([0, 100]); // Stress percentage range is 0 to 100

  focusChart.xAxis.call(d3.axisBottom(focusChart.xScale).ticks(20).tickFormat(d => `${d}s`));
  focusChart.yAxis.call(d3.axisLeft(focusChart.yScale).ticks(20).tickFormat(d => `${d}%`));

  // Update the line
  focusChart.path.datum(stressData).attr("d", focusChart.line);
  console.log("Updated Stress Percentage:", stressPer);
}

// Update charts every second
setInterval(() => {
  updateGsrChart();
  updateDiffChart();
  countDistraction(gsrValue, gsrPrev);
  updateStressChart();
}, 1000);


let cross = document.getElementById("cross");
let graphData = document.getElementById("gsrGraph");
let data = document.getElementById("graphs");

data.addEventListener("click", ()=>{
  cross.style.visibility = "visible";
  graphData.style.display = "flex";
});

cross.addEventListener("click", ()=>{
  cross.style.visibility = "hidden";
  graphData.style.display = "none";
})