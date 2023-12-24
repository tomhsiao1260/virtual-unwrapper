import { ShaderMaterial, DoubleSide } from "three"

export class Shader extends ShaderMaterial {
  constructor(params) {
    super({
      side: DoubleSide,
      transparent: true,

      uniforms: {
        tDiffuse: { value: null },
        tEdge: { value: null },
      },

      vertexShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        void main()
        {
          vec3 newPosition = position;

          vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;

          gl_Position = projectedPosition;
          vUv = uv;
        }
      `,

      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform sampler2D tEdge;

        varying vec2 vUv;

        void main() {
          vec4 edgeColor = texture2D(tEdge, vec2(vUv.x, vUv.y));

          float e_left = edgeColor.r;
          float e_right = edgeColor.g;

          float r = (1.0 - e_left - e_right) * vUv.x + e_left;

          vec4 color = texture2D(tDiffuse, vec2(r, vUv.y));

          gl_FragColor = color;
        }
      `
    });

    this.setValues(params);
  }
}
