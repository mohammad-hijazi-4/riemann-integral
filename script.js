"use strict";

const form = document.querySelector("#calculator-form");
const functionInput = document.querySelector("#function-input");
const lowerInput = document.querySelector("#lower-input");
const upperInput = document.querySelector("#upper-input");
const countInput = document.querySelector("#count-input");
const countOutput = document.querySelector("#count-output");
const canvas = document.querySelector("#graph");
const ctx = canvas.getContext("2d");
const errorMessage = document.querySelector("#error-message");

const display = {
  sum: document.querySelector("#sum-result"),
  integral: document.querySelector("#integral-result"),
  error: document.querySelector("#error-result"),
  width: document.querySelector("#width-result"),
  formula: document.querySelector("#formula-output"),
};

const allowedNames = new Set(["x", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "ln", "floor", "ceil", "pi", "e"]);

function compileExpression(source) {
  const normalized = source.toLowerCase().replace(/π/g, "pi").replace(/\^/g, "**").trim();
  if (!normalized || /[^0-9a-z_+\-*/().,\s*]/i.test(normalized)) throw new Error("Use only supported mathematical symbols.");
  const identifiers = normalized.match(/[a-z_]+/g) || [];
  if (identifiers.some((name) => !allowedNames.has(name))) throw new Error("The expression contains an unsupported name.");

  const js = normalized
    .replace(/\bln\b/g, "Math.log")
    .replace(/\b(sin|cos|tan|sqrt|abs|exp|log|floor|ceil)\b/g, "Math.$1")
    .replace(/\bpi\b/g, "Math.PI")
    .replace(/\be\b/g, "Math.E");
  const fn = new Function("x", `"use strict"; return (${js});`);
  return (x) => {
    const value = Number(fn(x));
    return Number.isFinite(value) ? value : NaN;
  };
}

function simpson(fn, a, b, intervals = 4000) {
  const n = intervals % 2 ? intervals + 1 : intervals;
  const h = (b - a) / n;
  let total = fn(a) + fn(b);
  for (let i = 1; i < n; i += 1) total += (i % 2 ? 4 : 2) * fn(a + i * h);
  return total * h / 3;
}

function calculateSum(fn, a, b, n, method) {
  const width = (b - a) / n;
  const rectangles = [];
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    const left = a + i * width;
    const sample = method === "left" ? left : method === "right" ? left + width : left + width / 2;
    const height = fn(sample);
    if (!Number.isFinite(height)) throw new Error("The function is undefined inside this interval.");
    rectangles.push({ left, width, height });
    sum += height * width;
  }
  return { sum, width, rectangles };
}

function draw(fn, a, b, rectangles) {
  const padding = { left: 68, right: 24, top: 24, bottom: 54 };
  const samples = Array.from({ length: 700 }, (_, i) => {
    const x = a + (b - a) * i / 699;
    return { x, y: fn(x) };
  }).filter((p) => Number.isFinite(p.y));
  if (!samples.length) throw new Error("No finite values can be graphed on this interval.");

  const ys = samples.map((p) => p.y).concat(rectangles.map((r) => r.height), [0]);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const margin = (yMax - yMin) * 0.1;
  yMin -= margin;
  yMax += margin;

  const plotWidth = canvas.width - padding.left - padding.right;
  const plotHeight = canvas.height - padding.top - padding.bottom;
  const px = (x) => padding.left + (x - a) / (b - a) * plotWidth;
  const py = (y) => padding.top + (yMax - y) / (yMax - yMin) * plotHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#07111f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = padding.left + plotWidth * i / 10;
    ctx.beginPath(); ctx.moveTo(x, padding.top); ctx.lineTo(x, padding.top + plotHeight); ctx.stroke();
  }
  for (let i = 0; i <= 8; i += 1) {
    const y = padding.top + plotHeight * i / 8;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(padding.left + plotWidth, y); ctx.stroke();
  }

  const zeroY = py(0);
  ctx.strokeStyle = "rgba(255,255,255,.45)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(padding.left, zeroY); ctx.lineTo(padding.left + plotWidth, zeroY); ctx.stroke();

  for (const rect of rectangles) {
    const x = px(rect.left);
    const right = px(rect.left + rect.width);
    const y = py(rect.height);
    ctx.fillStyle = rect.height >= 0 ? "rgba(57,217,182,.24)" : "rgba(255,122,144,.24)";
    ctx.strokeStyle = rect.height >= 0 ? "rgba(57,217,182,.75)" : "rgba(255,122,144,.75)";
    ctx.lineWidth = 1;
    ctx.fillRect(x, Math.min(y, zeroY), right - x, Math.abs(zeroY - y));
    ctx.strokeRect(x, Math.min(y, zeroY), right - x, Math.abs(zeroY - y));
  }

  ctx.beginPath();
  samples.forEach((point, index) => index ? ctx.lineTo(px(point.x), py(point.y)) : ctx.moveTo(px(point.x), py(point.y)));
  ctx.strokeStyle = "#66a6ff";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#a9b8ce";
  ctx.font = "22px system-ui";
  ctx.fillText(format(a), padding.left, canvas.height - 18);
  const bText = format(b);
  ctx.fillText(bText, canvas.width - padding.right - ctx.measureText(bText).width, canvas.height - 18);
  ctx.fillText("x", canvas.width - padding.right - 6, zeroY - 12);
}

function format(value) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 1e-12) return "0";
  return Number(value.toPrecision(8)).toString();
}

function update() {
  errorMessage.textContent = "";
  try {
    const fn = compileExpression(functionInput.value);
    const a = Number(lowerInput.value);
    const b = Number(upperInput.value);
    const n = Number(countInput.value);
    const method = document.querySelector('input[name="method"]:checked').value;
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) throw new Error("The upper bound must be greater than the lower bound.");

    const result = calculateSum(fn, a, b, n, method);
    const integral = simpson(fn, a, b);
    draw(fn, a, b, result.rectangles);
    display.sum.textContent = format(result.sum);
    display.integral.textContent = format(integral);
    display.error.textContent = format(Math.abs(result.sum - integral));
    display.width.textContent = format(result.width);
    display.formula.textContent = `${method[0].toUpperCase() + method.slice(1)} sum: Σ f(xᵢ*)Δx, with n = ${n} and Δx = ${format(result.width)}.`;
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

form.addEventListener("submit", (event) => { event.preventDefault(); update(); });
countInput.addEventListener("input", () => { countOutput.value = countInput.value; update(); });
document.querySelectorAll('input[name="method"]').forEach((input) => input.addEventListener("change", update));
document.querySelector("#download-button").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "riemann-sum.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

update();
