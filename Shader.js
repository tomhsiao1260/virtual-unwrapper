import { ShaderMaterial, DoubleSide } from "three"

export class Shader extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        tPosition: { value: null },
        tUV: { value: null },
        tDistance: { value: null },
        tLabel: { value: null },
        uFlatten: { value: 1 },
        uLeft: { value: 0 },
        uRight: { value: 0 },
        uTop: { value: 0 },
        uBottom: { value: 0 },
      },

      vertexShader: /* glsl */ `
        #define scrollX 8096.0
        #define scrollY 7888.0
        #define scrollZ 14370.0

        uniform sampler2D tPosition;
        uniform sampler2D tUV;
        uniform float uFlatten;
        varying vec2 vUv;

        void main() {
          vec3 o = vec3(0.5);
          vec2 w = texture2D(tUV, vec2(uv.x, uv.y)).xy;
          vec4 p = texture2D(tPosition, w);
          vec3 s = vec3(scrollX, scrollY, scrollZ) / scrollZ;
          vec3 pos3D = (p.xyz - o) * s;

          vec3 newPosition = position;
          // vec3 newPosition = pos3D + uFlatten * (position - pos3D);

          vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
          modelPosition.xyz = pos3D + uFlatten * (modelPosition.xyz - pos3D);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;
          vUv = uv;
        }
      `,

      fragmentShader: /* glsl */ `
        uniform sampler2D tUV;
        uniform sampler2D tDistance;
        uniform sampler2D tLabel;
        uniform float uLeft;
        uniform float uRight;
        uniform float uTop;
        uniform float uBottom;

        varying vec2 vUv;

        void main() {
          vec4 distance = texture2D(tDistance, vec2(vUv.x, vUv.y));

          float e_left = 1.0 - distance.r;
          float e_right = 1.0 - distance.g;
          float e_top = 1.0 - distance.b;
          float e_bottom = 1.0 - distance.a;

          float r = (1.0 - e_left - e_right) * vUv.x;
          r += e_left * uLeft + e_left * e_right * (uLeft - uRight);
          r /= 1.0 - e_left - e_right + e_left * uLeft + e_right * uRight;

          float s = (1.0 - e_top - e_bottom) * vUv.y;
          s += e_bottom * uBottom + e_bottom * e_top * (uBottom - uTop);
          s /= 1.0 - e_bottom - e_top + e_bottom * uBottom + e_top * uTop;

          // vec4 color = vec4(vUv, 1.0, 1.0);
          vec4 color = texture2D(tUV, vec2(r, s));

          // vec4 c = texture2D(tUV, vec2(r, s));
          // vec4 color = texture2D(tLabel, c.xy);

          // if (c.a < 0.01) discard;
          if (color.a < 0.01) discard;

          gl_FragColor = color;
        }
      `
    });

    this.setValues(params);
  }
}
