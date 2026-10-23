/**
 * Ambient Earth for the dark theme — plain WebGL 1, no library.
 *
 * The globe is not a mesh: a single quad covers the canvas and the fragment
 * shader intersects each pixel's ray with a sphere. The rim is therefore a
 * perfect circle at any size, and the atmosphere, twilight and city lights
 * are computed exactly. Textures: NASA Blue Marble (day) and Black Marble
 * 2016 (night lights), public domain, reduced to 2048×1024 WebP.
 *
 * Cost control: the canvas only covers the globe's box, is drawn at a
 * reduced resolution, 30 evenly spaced frames per second, and stops when the
 * tab is hidden. With `animate: false` a single frame is drawn.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform mat3 uToEarth;   // view space -> Earth-fixed frame
uniform vec3 uSun;       // sun direction, view space
uniform float uR;        // sphere radius in quad units
uniform float uPx;       // one pixel in quad units (edge antialiasing)
uniform vec2 uFadeAt;    // where the globe is fully visible (quad units)
const float PI = 3.14159265;

// Screen-space noise: breaks the banding of dark gradients on 8-bit screens.
float dither(vec2 c) {
  return fract(52.9829189 * fract(dot(c, vec2(0.06711056, 0.00583715)))) - 0.5;
}

void main() {
  vec2 p = vUv;
  float r = length(p);
  vec3 col = vec3(0.0);
  float a = 0.0;

  if (r < uR + uPx) {
    float z = sqrt(max(uR * uR - r * r, 0.0));
    vec3 n = normalize(vec3(p, z));
    vec3 e = uToEarth * n;
    float lon = atan(e.x, e.z);
    float lat = asin(clamp(e.y, -1.0, 1.0));
    vec2 uv = vec2(0.5 + lon / (2.0 * PI), 0.5 - lat / PI);

    vec3 day = texture2D(uDay, uv).rgb;
    float lights = texture2D(uNight, uv).r;
    float ndl = dot(n, uSun);
    float lit = smoothstep(-0.10, 0.28, ndl);

    // Day side: kept low and slightly desaturated, it must not light the page.
    float grey = dot(day, vec3(0.299, 0.587, 0.114));
    vec3 dayCol = mix(vec3(grey), day, 0.8) * (0.24 + 0.9 * max(ndl, 0.0));

    // Night side: warm city lights, a warm orange glow.
    vec3 cityCol = vec3(1.0, 0.62, 0.3) * pow(lights, 1.25) * 1.8;
    // Faint moonlight: the continents stay readable on the night side.
    vec3 nightCol = day * 0.06 + vec3(0.006, 0.009, 0.02) + cityCol;
    col = mix(nightCol, dayCol, lit);

    // Twilight band along the terminator.
    float dusk = exp(-pow(ndl / 0.09, 2.0));
    col += vec3(0.85, 0.45, 0.22) * dusk * 0.035;

    // Atmosphere seen through the limb.
    float fres = pow(1.0 - n.z, 2.6);
    col += vec3(0.34, 0.56, 1.0) * fres * (0.14 + 0.8 * smoothstep(-0.35, 0.65, ndl));

    a = 1.0 - smoothstep(uR - uPx, uR + uPx, r);
  }

  // Halo outside the limb, brighter on the sun's side.
  float outside = max(r - uR, 0.0);
  vec2 dir = r > 0.0 ? p / r : vec2(0.0);
  float sunSide = 0.25 + 0.75 * smoothstep(-0.5, 0.85, dot(dir, normalize(uSun.xy + vec2(1e-4))));
  float halo = exp(-outside * 14.0) * sunSide * 0.55 * step(uR - uPx, r);
  vec3 haloCol = vec3(0.3, 0.5, 1.0) * halo;

  // Premultiplied alpha: the page's own background shows through.
  vec3 rgb = col * a + haloCol * (1.0 - a);
  float alpha = max(a, halo);
  // Melt into the page: fully visible near the corner, gone toward the text.
  float melt = 1.0 - smoothstep(0.7, 1.5, distance(p, uFadeAt));
  rgb *= melt;
  alpha *= melt;
  rgb = max(rgb + dither(gl_FragCoord.xy) * (1.5 / 255.0), 0.0);
  gl_FragColor = vec4(rgb, max(alpha, max(rgb.r, max(rgb.g, rgb.b))));
}
`;

type Options = {
  canvas: HTMLCanvasElement;
  dayUrl: string;
  nightUrl: string;
  /** false: draw one still frame (reduced motion). */
  animate: boolean;
  onFirstFrame?: () => void;
};

/** Seconds for one full turn of the globe. */
const TURN_SECONDS = 240;
/** Frames drawn per second, as an exact fraction of the screen's refresh rate. */
const TARGET_FPS = 30;
const RADIUS = 0.8;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Texture introuvable : ${url}`));
    img.src = url;
  });
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader invalide");
  }
  return shader;
}

function texture(gl: WebGLRenderingContext, unit: number, img: HTMLImageElement) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Longitude wraps around; latitude stops at the poles.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

/** Where the sun stands today: declination, and the longitude under it (UTC). */
export function subsolarPoint(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = (date.getTime() - start) / 86_400_000;
  const declination =
    ((-23.44 * Math.PI) / 180) * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const longitude = ((12 - hours) * 15 * Math.PI) / 180;
  return { declination, longitude };
}

type Mat3 = number[];
const mul = (a: Mat3, b: Mat3): Mat3 => {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return o;
};
const rotX = (t: number): Mat3 => [
  1,
  0,
  0,
  0,
  Math.cos(t),
  -Math.sin(t),
  0,
  Math.sin(t),
  Math.cos(t),
];
const rotZ = (t: number): Mat3 => [
  Math.cos(t),
  -Math.sin(t),
  0,
  Math.sin(t),
  Math.cos(t),
  0,
  0,
  0,
  1,
];
const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const apply = (m: Mat3, v: number[]) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

/**
 * Starts the globe. Resolves with a function that stops it and frees the GPU,
 * or rejects when WebGL or the textures are unavailable.
 */
export async function mountEarthGlobe({
  canvas,
  dayUrl,
  nightUrl,
  animate,
  onFirstFrame,
}: Options): Promise<() => void> {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL indisponible");

  const [dayImg, nightImg] = await Promise.all([loadImage(dayUrl), loadImage(nightUrl)]);

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Programme invalide");
  }
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  texture(gl, 0, dayImg);
  texture(gl, 1, nightImg);
  gl.uniform1i(gl.getUniformLocation(program, "uDay"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "uNight"), 1);
  gl.uniform1f(gl.getUniformLocation(program, "uR"), RADIUS);
  gl.uniform2f(gl.getUniformLocation(program, "uFadeAt"), 0.3, -0.3);
  const uToEarth = gl.getUniformLocation(program, "uToEarth");
  const uSun = gl.getUniformLocation(program, "uSun");
  const uPx = gl.getUniformLocation(program, "uPx");
  gl.clearColor(0, 0, 0, 0);

  // Light from the left and slightly behind: mostly the night side faces the
  // reader, with a thin lit crescent — the city lights carry the picture.
  const sunPoint = subsolarPoint();
  const sun = (() => {
    const v = [-0.9, 0.18 + Math.sin(sunPoint.declination) * 0.6, -0.12];
    const l = Math.hypot(v[0], v[1], v[2]);
    return v.map((x) => x / l);
  })();
  gl.uniform3fv(uSun, sun);

  // Earth -> view: a lean for a living silhouette, a slight view from above,
  // then the turn. The start angle puts under the sun the longitude that
  // really has noon now, so the first frame tells the true time of day.
  const lean = rotZ((-18 * Math.PI) / 180);
  const fromAbove = rotX((14 * Math.PI) / 180);
  const sunEarthNow = apply(transpose(mul(fromAbove, lean)), sun);
  const sunLonInView = Math.atan2(sunEarthNow[0], sunEarthNow[2]);
  const spin0 = sunLonInView - sunPoint.longitude;
  const omega = (2 * Math.PI) / TURN_SECONDS;

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    // Ambient background: below native resolution is invisible and much cheaper.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
    const w = Math.max(1, Math.round(box.width * scale));
    const h = Math.max(1, Math.round(box.height * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform1f(uPx, 2.4 / Math.min(w, h));
    }
  };

  // Earth -> view = base · rotY(spin), written in place every frame: no
  // allocation, so no garbage collection pauses while the page scrolls.
  const base = mul(fromAbove, lean);
  const toView = new Float32Array(9);
  // Angle of the globe, advanced only when a frame is drawn: nothing jumps
  // after a pause.
  let spin = spin0;
  const draw = () => {
    const c = Math.cos(spin);
    const sn = Math.sin(spin);
    for (let r = 0; r < 3; r++) {
      const b0 = base[r * 3];
      const b1 = base[r * 3 + 1];
      const b2 = base[r * 3 + 2];
      toView[r * 3] = b0 * c - b2 * sn;
      toView[r * 3 + 1] = b1;
      toView[r * 3 + 2] = b0 * sn + b2 * c;
    }
    // GLSL reads matrices column by column: the transpose of view->earth is earth->view.
    gl.uniformMatrix3fv(uToEarth, false, toView);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Even cadence at low cost. The screen's refresh period is measured on the
  // first frames; then each frame is drawn exactly `every` refreshes after
  // the previous one (2 at 60 Hz, 4 at 120 Hz). Between two frames the
  // browser is not woken up: a timer waits until mid-way, and the next
  // animation frame then lands on the right refresh — same interval every
  // time, ~30 wake-ups a second instead of 60.
  let raf = 0;
  let timer = 0;
  let first = true;
  let every = 2;
  let refreshMs = 1000 / 60;
  let lastNow = 0;
  let lastDraw = 0;
  const intervals: number[] = [];
  const nextFrame = () => {
    timer = window.setTimeout(
      () => {
        raf = requestAnimationFrame(loop);
      },
      Math.max(0, (every - 0.5) * refreshMs - 2),
    );
  };
  const loop = (now: number) => {
    if (intervals.length < 15) {
      // Measuring the refresh rate: one animation frame after another.
      if (lastNow) intervals.push(now - lastNow);
      lastNow = now;
      if (intervals.length === 15) {
        refreshMs = [...intervals].sort((x, y) => x - y)[7];
        every = Math.max(1, Math.round(1000 / refreshMs / TARGET_FPS));
      }
      if (first) {
        first = false;
        draw();
        onFirstFrame?.();
      }
      raf = requestAnimationFrame(loop);
      return;
    }
    // The angle follows the time really elapsed (a frame a few ms late
    // keeps the speed exact), capped at two frames so nothing jumps after
    // a pause or a slow moment.
    const frameMs = every * refreshMs;
    const elapsed = lastDraw ? Math.min(now - lastDraw, 2 * frameMs) : frameMs;
    lastDraw = now;
    spin += (omega * elapsed) / 1000;
    draw();
    nextFrame();
  };
  const stopLoop = () => {
    window.clearTimeout(timer);
    cancelAnimationFrame(raf);
  };

  const observer = new ResizeObserver(() => {
    resize();
    if (!animate) draw();
  });
  observer.observe(canvas);
  resize();

  const onVisibility = () => {
    if (!animate) return;
    stopLoop();
    // Resumes where it stopped: the angle only moves when a frame is drawn.
    if (!document.hidden) {
      lastDraw = 0;
      raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    stopLoop();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  if (animate) {
    raf = requestAnimationFrame(loop);
  } else {
    draw();
    onFirstFrame?.();
  }

  return () => {
    stopLoop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    if (!lost) gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
