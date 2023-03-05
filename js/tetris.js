import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

let squareRotation = 0.0;
let deltaTime = 0
const vertices = [
    1.0, 1.0,
    1.0, -1.0,
    -1.0, 1.0,
    -1.0, -1.0,
]

const positions = []
for (let i = 0; i < vertices.length; i += 2) {
    positions.push(vec2.fromValues(vertices[i], vertices[i + 1]));
}

main();

function main() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext("webgl");
    // gl.canvas.width = window.innerWidth;
    // gl.canvas.height = window.innerHeight;

    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader program
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }
        `;

    // Fragment shader program
    const fsSource = `
        varying lowp vec4 vColor;

        void main() {
          gl_FragColor = vColor;
        }
      `;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        }
    }

    const buffers = initBuffers(gl, squareRotation);
    let then = 0;

    function render(now) {
        now *= 0.001;
        deltaTime = now - then;
        then = now;

        for (let i = 0; i < positions.length; i++) {
            vec2.rotate(positions[i], positions[i], origin, deltaTime);
        }

        const newData = new Float32Array(positions.reduce((acc, curVal) => {
            return acc.concat(...curVal)
        }, []));
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, newData, gl.DYNAMIC_DRAW);

        drawScene(gl, programInfo, buffers, squareRotation);
        squareRotation += deltaTime;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Could not link shader: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}