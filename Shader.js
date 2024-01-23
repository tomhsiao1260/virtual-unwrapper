import { ShaderMaterial, DoubleSide } from "three"

export class Shader extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        tPosition: { value: null },
        tPositions: { value: null },
        tColor: { value: null },
        tUV: { value: null },
        tUVs: { value: null },
        uWrapping: { value: 0 },
        uWrapPosition: { value: 0 },
      },

      vertexShader: /* glsl */ `
        #define PI 3.1415926535897932384626433832795
        #define scrollX 8096.0
        #define scrollY 7888.0
        #define scrollZ 14370.0

        uniform sampler2D tUV;
        uniform sampler2D tUVs;
        uniform sampler2D tPosition;
        uniform sampler2D tPositions;
        uniform float uWrapping;
        uniform float uWrapPosition;

        varying vec2 vUv;

        mat3 rotateZ(float theta) {
          float c = cos(theta);
          float s = sin(theta);

          return mat3(
            c, -s, 0.0,
            s, c, 0.0,
            0.0, 0.0, 1.0
          );
        }

        void main() {
          vec4 uvm = texture2D(tUV, uv) + texture2D(tUVs, uv) / 255.0;
          vec3 o = vec3(0.5);
          vec3 s = vec3(scrollX, scrollY, scrollZ) / scrollZ;
          vec4 p = texture2D(tPosition, uvm.xy) + texture2D(tPositions, uvm.xy) / 255.0;
          vec3 pos3D = (p.xyz - o) * s;

          pos3D *= rotateZ(uWrapping * 2.0 * PI);
          pos3D.y += 0.05;
          pos3D.x += uWrapPosition;

          vec3 newPosition = position;
          vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

          float flatten = 1.0 - smoothstep(uWrapPosition - 0.02, uWrapPosition, modelPosition.x);
          modelPosition.xyz = pos3D + flatten * (modelPosition.xyz - pos3D);

          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;
          vUv = uv;
        }
      `,

      fragmentShader: /* glsl */ `
        uniform sampler2D tColor;

        uniform sampler2D tUV;
        uniform sampler2D tUVs;

        varying vec2 vUv;

        void main() {
          vec4 uvm = texture2D(tUV, vUv) + texture2D(tUVs, vUv) / 255.0;
          // vec4 color = uvm;
          vec4 color = texture2D(tColor, uvm.xy);

          if (uvm.a < 0.5) discard;

          gl_FragColor = color;
        }
      `
    });

    this.setValues(params);
  }
}