#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

void main()
{
    gl_FragColor  = texture2D(uTexture, vUv);
}
