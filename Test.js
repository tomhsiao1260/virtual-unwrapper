import { ShaderMaterial, DoubleSide } from "three"

export class Test extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        t: { value: null },
      },

      vertexShader: /* glsl */ `
        varying highp vec2 vUv;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;
          vUv = uv;
        }
      `,

      fragmentShader: /* glsl */ `
        varying highp vec2 vUv;
        uniform sampler2D t;

        void main() {
          highp float x = (0.34 - 0.33) * vUv.x + 0.33;
          highp float y = (0.34 - 0.33) * vUv.y + 0.33;
          vec4 color = texture2D(t, vec2(0.33, 0.33));

          if (color.r < 0.5) discard;

          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `
    });

    this.setValues(params);
  }
}
