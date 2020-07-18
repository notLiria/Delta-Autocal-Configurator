import * as Calculations from "./calculations";
import "normalize.css";
import "./styles/main.scss";


const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

//const btn = document.getElementById("calc");
const variables = $$(".calc-input");


const outputContainer = $(".output-container") as HTMLDivElement;

// btn.addEventListener("click", calc_radius);
variables.forEach((input) => {
  input.addEventListener("change", () => {
    outputContainer.removeAttribute("hidden");
    calc_radius();
  });
});


function probe(radius, startAt, n, x0, y0){
  let res="";
  for (let i = 0; i < n; ++i){
    let probe_x = radius * Math.sin((2 * Math.PI * i)/n);
    let probe_y = radius * Math.cos((2 * Math.PI * i)/n);
    const radius_2 = Math.sqrt(Math.pow(probe_x + x0, 2) + Math.pow(probe_y + y0, 2));
    if (radius_2 > radius){
      const factor = radius/radius_2;
      probe_x *= factor;
      probe_y *= factor;
    }
    res += "G30 P" + (startAt + i)
        + " X" + probe_x.toFixed(2)
        + "Y" + probe_y.toFixed(2)
        + "Z-9999 H0\n";
    res += "if result != 0\n continue \n"
  }
  return res
}

function get_checked_value(points: NodeListOf<HTMLElement>){
  let value = 0;
  for (let i = 0; i < points.length; i++){
    if ((points[i] as HTMLInputElement).checked){
      return parseInt((points[i] as HTMLInputElement).value);
    }
  }
}

function calc_radius() {

  const radius = parseFloat((document.getElementById("radius") as HTMLInputElement).value);
  const probe_offset_x = parseFloat((document.getElementById("probe-offset-x") as HTMLInputElement).value);
  const probe_offset_y = parseFloat((document.getElementById("probe-offset-y") as HTMLInputElement).value);

  const peripheral_points = get_checked_value(document.getElementsByName("peripheral-points"));
  const halfway_points = get_checked_value(document.getElementsByName("halfway-points"));
  const calibration_factors = get_checked_value(document.getElementsByName("calibration-factors"));
  const total_points = peripheral_points + halfway_points + 1;

  console.log(radius);
  console.log(probe_offset_x);
  console.log(probe_offset_y);
  console.log(peripheral_points);
  console.log(halfway_points);
  console.log(calibration_factors);

  const error = document.getElementById("error");

  if (total_points < calibration_factors) {
    document.getElementById("error").innerHTML = "Error: Must have as many points as factors";
    return error.removeAttribute("hidden");
  } else if (total_points > 16) {
    document.getElementById("error").innerHTML = "Error: Maxmum of 16 points!";
    return error.removeAttribute("hidden");
  } else {
    let result = ";bed.g file for RepRapFirmware, generated by Liria's Delta Autocal Configurator, based on Escher3D's calculator\n";
    result += "; " + peripheral_points + " points, " + calibration_factors + " factors, probing radius: " + radius + " probe offset (" + probe_offset_x + ", " + probe_offset_y + "\n";
    result += "G28 \n";
    result += "while true\n";
    result += "if iterations = 20\n";
    result += "abort \"Too many calibration attempts\"";
    result += probe(radius, 0, peripheral_points, probe_offset_x, probe_offset_y);
    result += probe(radius / 2, peripheral_points, halfway_points, probe_offset_x, probe_offset_y);
    result += "G30 P" + (peripheral_points - 1) + " X0 Y0 Z-99999 S" + calibration_factors + "\n";
    result += "if move.calibration.final.deviation <= 0.03\n"
        + "break\n"
        + "echo \"Repeating calibration because deviation is too high (\" ^move.calibration.final.deviation ^ \"mm)\"\n"
        + "echo  \"Auto calibration successful, deviation\", move.calibration.final.deviation ^ \"mm\"\n"
        + "G1 X0 Y0 Z150 F10000\n"
    document.getElementById("result").innerHTML= result;
    console.log(result);
  }
}
