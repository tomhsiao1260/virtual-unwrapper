#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform sampler2D uTexture;
uniform float uAlpha;

varying vec2 vUv;

void main()
{
    vec4 color = texture2D(uTexture, vUv);
    color.rgb = 1.0 - color.rgb;
    gl_FragColor = color;
    gl_FragColor *= uAlpha;
}
