# Riemann Sum Visualizer

An interactive, dependency-free web application for approximating definite integrals with left, right, and midpoint Riemann sums.

## Features

- Plot a real-valued function over a chosen interval
- Visualize positive and negative Riemann rectangles
- Compare left, right, and midpoint approximations
- Adjust the number of rectangles from 1 to 200
- Compare the sum with a numerical Simpson-rule estimate
- Download the graph as a PNG image
- Responsive, accessible interface
- No framework, package installation, or build step required

## Run locally

Download or clone the repository, then open `index.html` in a modern browser.

```bash
git clone https://github.com/mohammad-hijazi-4/riemann-integral.git
cd riemann-integral
```

You can also use a small local server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Supported expressions

Use the variable `x`, arithmetic operators, parentheses, and powers written with `^`.

Supported functions include `sin`, `cos`, `tan`, `sqrt`, `abs`, `exp`, `log`, `ln`, `floor`, and `ceil`. Constants `pi` and `e` are also supported.

Examples:

```text
sin(x) + 2
x^2
sqrt(1 - x^2)
exp(-x^2)
1 / (1 + x^2)
```

## Deploy with GitHub Pages

1. Open the repository's **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Save.

GitHub will display the public website URL after deployment.

## Mathematics

For an interval `[a, b]` split into `n` equal subintervals,

```text
Δx = (b - a) / n
Rₙ = Σ f(xᵢ*) Δx
```

The sample point `xᵢ*` is the left endpoint, midpoint, or right endpoint according to the chosen method.

## License

Licensed under the [MIT License](LICENSE).
