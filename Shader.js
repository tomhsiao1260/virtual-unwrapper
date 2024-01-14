import { ShaderMaterial, DoubleSide } from "three"

export class Shader extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        tPosition: { value: null },
        tUV: { value: null },
      },

      vertexShader: /* glsl */ `
        #define PI 3.1415926535897932384626433832795
        varying vec2 vUv;

        void main() {
          vec3 newPosition = position;
          vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;
          vUv = uv;
        }
      `,

      fragmentShader: /* glsl */ `
        uniform sampler2D tUV;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tUV, vUv);

          if (color.a < 0.01) discard;

          gl_FragColor = color;
        }
      `
    });

    this.setValues(params);
  }
}